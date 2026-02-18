import { z } from "zod";

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export const parseBody = async <T>(
  req: Request,
  schema: z.ZodType<T>
): Promise<{ data: T } | { error: Response }> => {
  let body: unknown;
  try {
    body = await req.json();
  } catch (_error) {
    return { error: jsonResponse({ error: "Invalid JSON body" }, 400) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: jsonResponse(
        {
          error: "Validation error",
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        422
      ),
    };
  }

  return { data: parsed.data };
};

export const getApiPath = (url: URL) => {
  const path = url.pathname;
  return path.startsWith("/api") ? path : "/api";
};
