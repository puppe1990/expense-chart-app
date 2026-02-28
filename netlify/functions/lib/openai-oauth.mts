import { errorResponse, jsonResponse, parseBody } from "./response.mts";
import { openAiOauthExchangeSchema, openAiOauthRefreshSchema } from "./validation.mts";

const OPENAI_TOKEN_URL = "https://auth.openai.com/oauth/token";
const DEFAULT_OPENAI_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";

const buildTokenPayload = (payload: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}) => {
  const expiresIn = Number(payload.expires_in ?? 0);
  const expiresAt = Date.now() + Math.max(expiresIn, 60) * 1000;

  return {
    accessToken: payload.access_token ?? "",
    refreshToken: payload.refresh_token ?? "",
    expiresIn,
    expiresAt,
    tokenType: payload.token_type ?? "Bearer",
    scope: payload.scope ?? "",
    idToken: payload.id_token ?? "",
  };
};

const exchangeOrRefreshToken = async (
  body: URLSearchParams,
  requestId: string
): Promise<Response> => {
  const response = await fetch(OPENAI_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      typeof payload.error_description === "string"
        ? payload.error_description
        : typeof payload.error === "string"
          ? payload.error
          : "OpenAI OAuth failed";
    return errorResponse({
      code: "INTERNAL_ERROR",
      message,
      requestId,
      status: 502,
    });
  }

  const tokenData = buildTokenPayload(payload as never);
  if (!tokenData.accessToken) {
    return errorResponse({
      code: "INTERNAL_ERROR",
      message: "OpenAI OAuth returned empty access token",
      requestId,
      status: 502,
    });
  }

  return jsonResponse(tokenData);
};

export const handleOpenAiOauthExchange = async (req: Request, requestId: string) => {
  const parsed = await parseBody(req, openAiOauthExchangeSchema, requestId);
  if ("error" in parsed) return parsed.error;

  const clientId = Netlify.env.get("OPENAI_OAUTH_CLIENT_ID") || DEFAULT_OPENAI_CLIENT_ID;
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code: parsed.data.code,
    redirect_uri: parsed.data.redirectUri,
    code_verifier: parsed.data.codeVerifier,
  });

  return exchangeOrRefreshToken(params, requestId);
};

export const handleOpenAiOauthRefresh = async (req: Request, requestId: string) => {
  const parsed = await parseBody(req, openAiOauthRefreshSchema, requestId);
  if ("error" in parsed) return parsed.error;

  const clientId = Netlify.env.get("OPENAI_OAUTH_CLIENT_ID") || DEFAULT_OPENAI_CLIENT_ID;
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: parsed.data.refreshToken,
  });

  return exchangeOrRefreshToken(params, requestId);
};
