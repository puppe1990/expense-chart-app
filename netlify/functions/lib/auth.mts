import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

import type { AuthInfo } from "./types.mts";
import { getDbClient } from "./db.mts";
import { jsonResponse, parseBody } from "./response.mts";
import { authSchema } from "./validation.mts";

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const getJwtSecret = () => {
  const secret = Netlify.env.get("JWT_SECRET");
  if (!secret) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return secret;
};

const createToken = (userId: string, email: string) =>
  jwt.sign({ sub: userId, email }, getJwtSecret(), { expiresIn: "7d" });

export const verifyAuth = (req: Request): AuthInfo | null => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  try {
    const payload = jwt.verify(authHeader.slice(7), getJwtSecret());
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

export const handleSignUp = async (req: Request) => {
  const parsed = await parseBody(req, authSchema);
  if ("error" in parsed) return parsed.error;
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  const db = getDbClient();
  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (existing.rows.length > 0) {
    return jsonResponse({ error: "Email already registered" }, 409);
  }

  const userId = generateId();
  const passwordHash = await bcrypt.hash(password, 10);

  await db.execute({
    sql: "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
    args: [userId, email, passwordHash],
  });

  const token = createToken(userId, email);
  return jsonResponse({ token, user: { id: userId, email } }, 201);
};

export const handleSignIn = async (req: Request) => {
  const parsed = await parseBody(req, authSchema);
  if ("error" in parsed) return parsed.error;
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (result.rows.length === 0) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  const user = result.rows[0] as Record<string, unknown>;
  const passwordHash = String(user.password_hash ?? "");
  const passwordOk = await bcrypt.compare(password, passwordHash);

  if (!passwordOk) {
    return jsonResponse({ error: "Invalid credentials" }, 401);
  }

  const userId = String(user.id);
  const userEmail = String(user.email);
  const token = createToken(userId, userEmail);

  return jsonResponse({ token, user: { id: userId, email: userEmail } });
};
