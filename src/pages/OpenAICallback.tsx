import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeOpenAiCode, consumeOpenAiOAuthContext } from "@/lib/openai-oauth";

const OpenAICallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Finalizando login com ChatGPT...");

  useEffect(() => {
    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const error = searchParams.get("error");

      if (error) {
        setMessage("Login com ChatGPT cancelado.");
        setTimeout(() => navigate("/"), 1200);
        return;
      }

      if (!code || !state) {
        setMessage("Callback inválido do ChatGPT.");
        setTimeout(() => navigate("/"), 1200);
        return;
      }

      const context = consumeOpenAiOAuthContext();
      if (!context.state || !context.codeVerifier || context.state !== state) {
        setMessage("Estado OAuth inválido. Tente conectar novamente.");
        setTimeout(() => navigate("/"), 1500);
        return;
      }

      try {
        await exchangeOpenAiCode(code, context.codeVerifier, context.redirectUri);
        setMessage("ChatGPT conectado com sucesso.");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Falha ao conectar ChatGPT.");
      } finally {
        setTimeout(() => navigate("/"), 1500);
      }
    };

    void run();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
};

export default OpenAICallbackPage;
