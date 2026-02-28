import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type React from "react";

import { AuthProvider, useAuth } from "./use-auth";

const createJsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hydrates authenticated session from /api/auth/me", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createJsonResponse({ user: { id: "u-1", email: "user@example.com" } })
    );
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe("user@example.com");
  });

  it("signs in and signs out using cookie-based auth endpoints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({ error: { message: "Unauthorized" } }, 401))
      .mockResolvedValueOnce(
        createJsonResponse({ user: { id: "u-2", email: "login@example.com" } }, 200)
      )
      .mockResolvedValueOnce(createJsonResponse({ ok: true }, 200));
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      await result.current.signIn("login@example.com", "password123");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe("login@example.com");

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/auth/signin",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/auth/signout",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });
});
