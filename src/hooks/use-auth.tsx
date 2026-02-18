import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AUTH_STORAGE_KEY = "expense-chart-auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const saveAuthState = (state: AuthState | null) => {
  if (state) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthState;
    return parsed.token ?? null;
  } catch (_error) {
    return null;
  }
};

const fetchAuth = async (path: string, payload: { email: string; password: string }) => {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Authentication failed");
  }

  return (await response.json()) as { token: string; user: AuthUser };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        setState(JSON.parse(raw) as AuthState);
      }
    } catch (_error) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const auth = await fetchAuth("/api/auth/signin", { email, password });
    setState(auth);
    saveAuthState(auth);
  };

  const signUp = async (email: string, password: string) => {
    const auth = await fetchAuth("/api/auth/signup", { email, password });
    setState(auth);
    saveAuthState(auth);
  };

  const signOut = () => {
    setState(null);
    saveAuthState(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state?.user ?? null,
      token: state?.token ?? null,
      isAuthenticated: Boolean(state?.token),
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [state, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
