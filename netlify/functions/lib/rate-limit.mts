import { getDbClient } from "./db.mts";
import { jsonResponse } from "./response.mts";

type RateLimitOptions = {
  bucket: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

export const getClientIp = (req: Request) => {
  const direct = req.headers.get("x-nf-client-connection-ip")?.trim();
  if (direct) return direct;

  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwardedFor) return forwardedFor;

  const cf = req.headers.get("cf-connecting-ip")?.trim();
  if (cf) return cf;

  return "unknown";
};

export const enforceRateLimit = async ({
  bucket,
  identifier,
  limit,
  windowMs,
}: RateLimitOptions): Promise<Response | null> => {
  const db = getDbClient();
  const key = `${bucket}:${identifier}`;
  const now = Date.now();

  const result = await db.execute({
    sql: "SELECT count, reset_at FROM rate_limits WHERE key = ? LIMIT 1",
    args: [key],
  });

  const current = result.rows[0] as Record<string, unknown> | undefined;
  const currentCount = current ? Number(current.count) : 0;
  const resetAt = current ? Number(current.reset_at) : 0;

  if (!current || resetAt <= now) {
    await db.execute({
      sql: `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
            ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`,
      args: [key, now + windowMs],
    });
    return null;
  }

  if (currentCount >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
    return jsonResponse(
      {
        error: "Too many requests",
        retryAfterSeconds,
      },
      429
    );
  }

  await db.execute({
    sql: "UPDATE rate_limits SET count = count + 1 WHERE key = ?",
    args: [key],
  });

  return null;
};
