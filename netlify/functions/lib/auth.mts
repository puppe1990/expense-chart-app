import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

import type { AuthInfo } from "./types.mts";
import { getDbClient } from "./db.mts";
import { errorResponse, jsonResponse, parseBody } from "./response.mts";
import { authSchema } from "./validation.mts";

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const SESSION_COOKIE_NAME = "expense_chart_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const isProductionEnv = () => {
  const context = Netlify.env.get("CONTEXT");
  const nodeEnv = Netlify.env.get("NODE_ENV");
  return context === "production" || nodeEnv === "production";
};

const getJwtSecret = () => {
  const secret = Netlify.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return secret;
};

const createToken = (userId: string, email: string) =>
  jwt.sign({ sub: userId, email }, getJwtSecret(), { expiresIn: "7d" });

const createSessionCookie = (token: string) => {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
  ];
  if (isProductionEnv()) {
    parts.push("Secure");
  }
  return parts.join("; ");
};

const clearSessionCookie = () => {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (isProductionEnv()) {
    parts.push("Secure");
  }
  return parts.join("; ");
};

const getCookieValue = (req: Request, key: string): string | null => {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [cookieKey, ...rawValueParts] = cookie.trim().split("=");
    if (cookieKey !== key) continue;
    const rawValue = rawValueParts.join("=");
    if (!rawValue) return null;
    try {
      return decodeURIComponent(rawValue);
    } catch (_error) {
      return rawValue;
    }
  }
  return null;
};

export const verifyAuth = (req: Request): AuthInfo | null => {
  const sessionToken = getCookieValue(req, SESSION_COOKIE_NAME);
  const authHeader = req.headers.get("authorization") ?? "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = sessionToken ?? bearerToken;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "string") return null;
    const jwtPayload = payload as JwtPayload;
    if (!jwtPayload.sub || typeof jwtPayload.sub !== "string") return null;
    return {
      userId: jwtPayload.sub,
      email: typeof jwtPayload.email === "string" ? jwtPayload.email : undefined,
    };
  } catch (_error) {
    return null;
  }
};

export const handleSignUp = async (req: Request, requestId: string) => {
  const parsed = await parseBody(req, authSchema, requestId);
  if ("error" in parsed) return parsed.error;
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  const db = getDbClient();
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (existing.rows.length > 0) {
    return errorResponse({
      code: "VALIDATION_ERROR",
      message: "Email already registered",
      status: 409,
      requestId,
    });
  }

  const userId = generateId();
  const passwordHash = await bcrypt.hash(password, 10);

  await db.execute({
    sql: "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
    args: [userId, email, passwordHash],
  });

  const token = createToken(userId, email);
  return jsonResponse(
    { user: { id: userId, email } },
    201,
    { "set-cookie": createSessionCookie(token) }
  );
};

export const handleSignIn = async (req: Request, requestId: string) => {
  const parsed = await parseBody(req, authSchema, requestId);
  if ("error" in parsed) return parsed.error;
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (result.rows.length === 0) {
    return errorResponse({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
      status: 401,
      requestId,
    });
  }

  const user = result.rows[0] as Record<string, unknown>;
  const passwordHash = String(user.password_hash ?? "");
  const passwordOk = await bcrypt.compare(password, passwordHash);

  if (!passwordOk) {
    return errorResponse({
      code: "UNAUTHORIZED",
      message: "Invalid credentials",
      status: 401,
      requestId,
    });
  }

  const userId = String(user.id);
  const userEmail = String(user.email);
  const token = createToken(userId, userEmail);

  return jsonResponse(
    { user: { id: userId, email: userEmail } },
    200,
    { "set-cookie": createSessionCookie(token) }
  );
};

export const buildSignOutResponse = () =>
  jsonResponse(
    { ok: true },
    200,
    { "set-cookie": clearSessionCookie() }
  );
