import type { Config, Context } from "@netlify/functions";

import { handleAssistant } from "./lib/assistant.mts";
import { handleSignIn, handleSignUp, verifyAuth } from "./lib/auth.mts";
import { ensureSchema } from "./lib/db.mts";
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
import { getApiPath, jsonResponse } from "./lib/response.mts";

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

export default async (req: Request, _context: Context) => {
  try {
    await ensureSchema();

    const url = new URL(req.url);
    const path = getApiPath(url);
    const method = req.method.toUpperCase();
    const clientIp = getClientIp(req);

    if (path === "/api/health" && method === "GET") {
      return jsonResponse({ ok: true });
    }

    if (path === "/api/auth/signup" && method === "POST") {
      const blocked = await enforceRateLimit({
        bucket: "auth-signup",
        identifier: clientIp,
        limit: RATE_LIMITS.authSignupLimit,
        windowMs: RATE_LIMITS.authSignupWindowMs,
      });
      if (blocked) return blocked;
      return await handleSignUp(req);
    }

    if (path === "/api/auth/signin" && method === "POST") {
      const blocked = await enforceRateLimit({
        bucket: "auth-signin",
        identifier: clientIp,
        limit: RATE_LIMITS.authSigninLimit,
        windowMs: RATE_LIMITS.authSigninWindowMs,
      });
      if (blocked) return blocked;
      return await handleSignIn(req);
    }

    const auth = verifyAuth(req);
    if (!auth) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    if (path === "/api/auth/me" && method === "GET") {
      return jsonResponse({ user: { id: auth.userId, email: auth.email } });
    }

    if (path === "/api/expenses" && method === "GET") {
      return await handleGetExpenses(url, auth);
    }

    if (path === "/api/expenses" && method === "POST") {
      return await handleCreateExpense(req, auth);
    }

    if (path === "/api/expenses/batch" && method === "POST") {
      return await handleBatchExpense(req, auth);
    }

    if (path === "/api/expenses/replace" && method === "PUT") {
      return await handleReplaceExpenses(req, auth);
    }

    if (path === "/api/expenses" && method === "DELETE") {
      return await handleDeleteAllExpenses(auth);
    }

    if (path === "/api/assistant" && method === "POST") {
      const blocked = await enforceRateLimit({
        bucket: "assistant",
        identifier: `${auth.userId}:${clientIp}`,
        limit: RATE_LIMITS.assistantLimit,
        windowMs: RATE_LIMITS.assistantWindowMs,
      });
      if (blocked) return blocked;
      return await handleAssistant(req, auth);
    }

    if (path.startsWith("/api/expenses/") && method === "PUT") {
      const id = path.replace("/api/expenses/", "");
      return await handleUpdateOneExpense(req, id, auth);
    }

    if (path.startsWith("/api/expenses/") && method === "DELETE") {
      const id = path.replace("/api/expenses/", "");
      return await handleDeleteOneExpense(id, auth);
    }

    return jsonResponse({ error: "Not Found" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return jsonResponse({ error: message }, 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
