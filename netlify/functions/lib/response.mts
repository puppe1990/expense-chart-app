import { z } from "zod";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export const jsonResponse = (
  body: unknown,
  status = 200,
  headers?: HeadersInit
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...(headers ?? {}),
    },
  });

type ErrorResponseArgs = {
  code: ApiErrorCode;
  message: string;
  requestId: string;
  status: number;
  details?: unknown;
};

export const errorResponse = ({
  code,
  message,
  requestId,
  status,
  details,
}: ErrorResponseArgs) =>
  jsonResponse(
    {
      error: {
        code,
        message,
        requestId,
        ...(details !== undefined ? { details } : {}),
      },
    },
    status
  );

export const parseBody = async <T>(
  req: Request,
  schema: z.ZodType<T>,
  requestId = "unknown"
): Promise<{ data: T } | { error: Response }> => {
  let body: unknown;
  try {
    body = await req.json();
  } catch (_error) {
    return {
      error: errorResponse({
        code: "INVALID_JSON",
        message: "Invalid JSON body",
        status: 400,
        requestId,
      }),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      error: errorResponse({
        code: "VALIDATION_ERROR",
        message: "Validation error",
        status: 422,
        requestId,
        details: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
      }),
    };
  }

  return { data: parsed.data };
};

export const getApiPath = (url: URL) => {
  const path = url.pathname;
  return path.startsWith("/api") ? path : "/api";
};
