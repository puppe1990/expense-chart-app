export interface OpenAiTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
  tokenType: string;
  scope: string;
  idToken?: string;
}

const DEFAULT_OPENAI_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const OPENAI_AUTH_URL = "https://auth.openai.com/oauth/authorize";
const STORAGE_KEY = "openai_oauth_tokens";
const STATE_KEY = "openai_oauth_state";
const CODE_VERIFIER_KEY = "openai_oauth_code_verifier";
const REDIRECT_URI_KEY = "openai_oauth_redirect_uri";

const getClientId = () =>
  (import.meta.env.VITE_OPENAI_CLIENT_ID as string | undefined) || DEFAULT_OPENAI_CLIENT_ID;

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const randomString = (length = 64) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += chars[values[i] % chars.length];
  }
  return result;
};

const sha256 = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
};

const buildRedirectUri = () => `${window.location.origin}/oauth/openai/callback`;

export const getStoredOpenAiTokens = (): OpenAiTokens | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OpenAiTokens;
    if (!parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveOpenAiTokens = (tokens: OpenAiTokens) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
};

export const clearOpenAiTokens = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isTokenExpired = (tokens: OpenAiTokens) => Date.now() >= tokens.expiresAt - 60_000;

export const startOpenAiOAuth = async () => {
  const state = randomString(48);
  const codeVerifier = randomString(96);
  const codeChallenge = toBase64Url(await sha256(codeVerifier));
  const redirectUri = buildRedirectUri();

  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  sessionStorage.setItem(REDIRECT_URI_KEY, redirectUri);

  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "openid profile email offline_access",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    id_token_add_organizations: "true",
    originator: "openai_native",
  });

  window.location.href = `${OPENAI_AUTH_URL}?${params.toString()}`;
};

export const consumeOpenAiOAuthContext = () => {
  const state = sessionStorage.getItem(STATE_KEY);
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
  const redirectUri = sessionStorage.getItem(REDIRECT_URI_KEY) || buildRedirectUri();

  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(CODE_VERIFIER_KEY);
  sessionStorage.removeItem(REDIRECT_URI_KEY);

  return { state, codeVerifier, redirectUri };
};

export const exchangeOpenAiCode = async (code: string, codeVerifier: string, redirectUri: string) => {
  const response = await fetch("/api/openai/oauth/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ code, codeVerifier, redirectUri }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? "Falha ao concluir login com ChatGPT.");
  }

  const payload = (await response.json()) as OpenAiTokens;
  saveOpenAiTokens(payload);
  return payload;
};

export const refreshOpenAiToken = async (refreshToken: string) => {
  const response = await fetch("/api/openai/oauth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? "Falha ao renovar sessão ChatGPT.");
  }

  const payload = (await response.json()) as OpenAiTokens;
  saveOpenAiTokens(payload);
  return payload;
};
