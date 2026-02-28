import type { Config, Context } from "@netlify/functions";

import { handleAssistant } from "./lib/assistant.mts";
import { buildSignOutResponse, handleSignIn, handleSignUp, verifyAuth } from "./lib/auth.mts";
import { ensureSchema } from "./lib/db.mts";
import { handleOpenAiOauthExchange, handleOpenAiOauthRefresh } from "./lib/openai-oauth.mts";
import {
  handleBatchExpense,
  handleCreateExpense,
  handleDeleteAllExpenses,
  handleDeleteOneExpense,
  handleGetExpenses,
  handleReplaceExpenses,
  handleUpdateOneExpense,
} from "./lib/expenses.mts";
import { enforceRateLimit, getClientIp } from "./lib/rate-limit.mts";
import { errorResponse, getApiPath, jsonResponse } from "./lib/response.mts";

const getEnvInt = (key: string, fallback: number) => {
  const value = Netlify.env.get(key);
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const RATE_LIMITS = {
  authSignupLimit: getEnvInt("RATE_LIMIT_AUTH_SIGNUP_LIMIT", 5),
  authSignupWindowMs: getEnvInt("RATE_LIMIT_AUTH_SIGNUP_WINDOW_MS", 15 * 60 * 1000),
  authSigninLimit: getEnvInt("RATE_LIMIT_AUTH_SIGNIN_LIMIT", 10),
  authSigninWindowMs: getEnvInt("RATE_LIMIT_AUTH_SIGNIN_WINDOW_MS", 15 * 60 * 1000),
  assistantLimit: getEnvInt("RATE_LIMIT_ASSISTANT_LIMIT", 20),
  assistantWindowMs: getEnvInt("RATE_LIMIT_ASSISTANT_WINDOW_MS", 10 * 60 * 1000),
} as const;

const generateRequestId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const hashIdentifier = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const withRequestId = (response: Response, requestId: string) => {
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default async (req: Request, _context: Context) => {
  const requestId = generateRequestId();
  const method = req.method.toUpperCase();
  const url = new URL(req.url);
  const path = getApiPath(url);
  const clientIp = getClientIp(req);
  let authUserId: string | null = null;

  try {
    await ensureSchema();

    if (path === "/api/health" && method === "GET") {
      return withRequestId(jsonResponse({ ok: true }), requestId);
    }

    if (path === "/api/auth/signup" && method === "POST") {
      const blocked = await enforceRateLimit({
        bucket: "auth-signup",
        identifier: clientIp,
        limit: RATE_LIMITS.authSignupLimit,
        windowMs: RATE_LIMITS.authSignupWindowMs,
        requestId,
      });
      if (blocked) return withRequestId(blocked, requestId);
      return withRequestId(await handleSignUp(req, requestId), requestId);
    }

    if (path === "/api/auth/signin" && method === "POST") {
      const blocked = await enforceRateLimit({
        bucket: "auth-signin",
        identifier: clientIp,
        limit: RATE_LIMITS.authSigninLimit,
        windowMs: RATE_LIMITS.authSigninWindowMs,
        requestId,
      });
      if (blocked) return withRequestId(blocked, requestId);
      return withRequestId(await handleSignIn(req, requestId), requestId);
    }

    if (path === "/api/auth/signout" && method === "POST") {
      return withRequestId(buildSignOutResponse(), requestId);
    }

    const auth = verifyAuth(req);
    if (!auth) {
      return withRequestId(
        errorResponse({
          code: "UNAUTHORIZED",
          message: "Unauthorized",
          requestId,
          status: 401,
        }),
        requestId
      );
    }
    authUserId = auth.userId;

    if (path === "/api/auth/me" && method === "GET") {
      return withRequestId(
        jsonResponse({ user: { id: auth.userId, email: auth.email } }),
        requestId
      );
    }

    if (path === "/api/openai/oauth/exchange" && method === "POST") {
      return withRequestId(await handleOpenAiOauthExchange(req, requestId), requestId);
    }

    if (path === "/api/openai/oauth/refresh" && method === "POST") {
      return withRequestId(await handleOpenAiOauthRefresh(req, requestId), requestId);
    }

    if (path === "/api/expenses" && method === "GET") {
      return withRequestId(await handleGetExpenses(url, auth), requestId);
    }

    if (path === "/api/expenses" && method === "POST") {
      return withRequestId(await handleCreateExpense(req, auth, requestId), requestId);
    }

    if (path === "/api/expenses/batch" && method === "POST") {
      return withRequestId(await handleBatchExpense(req, auth, requestId), requestId);
    }

    if (path === "/api/expenses/replace" && method === "PUT") {
      return withRequestId(await handleReplaceExpenses(req, auth, requestId), requestId);
    }

    if (path === "/api/expenses" && method === "DELETE") {
      return withRequestId(await handleDeleteAllExpenses(auth), requestId);
    }

    if (path === "/api/assistant" && method === "POST") {
      const blocked = await enforceRateLimit({
        bucket: "assistant",
        identifier: `${auth.userId}:${clientIp}`,
        limit: RATE_LIMITS.assistantLimit,
        windowMs: RATE_LIMITS.assistantWindowMs,
        requestId,
      });
      if (blocked) return withRequestId(blocked, requestId);
      return withRequestId(await handleAssistant(req, auth, requestId), requestId);
    }

    if (path.startsWith("/api/expenses/") && method === "PUT") {
      const id = path.replace("/api/expenses/", "");
      return withRequestId(await handleUpdateOneExpense(req, id, auth, requestId), requestId);
    }

    if (path.startsWith("/api/expenses/") && method === "DELETE") {
      const id = path.replace("/api/expenses/", "");
      return withRequestId(await handleDeleteOneExpense(id, auth), requestId);
    }

    return withRequestId(
      errorResponse({
        code: "NOT_FOUND",
        message: "Not Found",
        requestId,
        status: 404,
      }),
      requestId
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal error";
    console.error(
      JSON.stringify({
        level: "error",
        code: "INTERNAL_ERROR",
        request_id: requestId,
        path,
        method,
        user_id_hash: hashIdentifier(authUserId ?? "anonymous"),
        message: errorMessage,
      })
    );

    return withRequestId(
      errorResponse({
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        requestId,
        status: 500,
      }),
      requestId
    );
  }
};

export const config: Config = {
  path: "/api/*",
};
