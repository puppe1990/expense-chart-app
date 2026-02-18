import { useMemo, useState } from "react";
import { Bot, ExternalLink, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type AssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

const INITIAL_MESSAGE: AssistantMessage = {
  role: "assistant",
  content:
    "Sou seu assistente Codex. Posso te ajudar com orçamento PF/PJ, categorias e decisões financeiras.",
};

export const CodexAssistant = () => {
  const { token } = useAuth();
  const [messages, setMessages] = useState<AssistantMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const historyForApi = useMemo(
    () =>
      messages
        .filter((message) => message.content.trim().length > 0)
        .slice(-12),
    [messages]
  );

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !token || isLoading) return;

    const userMessage: AssistantMessage = { role: "user", content };
    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: content,
          history: historyForApi,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorBody.error ?? "Falha ao conversar com o assistente.");
      }

      const data = (await response.json()) as { reply: string };
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.reply?.trim() || "Não consegui gerar uma resposta agora.",
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro no assistente.");
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: "Não consegui responder agora. Tente novamente em instantes.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-50 w-[calc(100vw-2rem)] max-w-[400px] rounded-xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-4 w-4" />
              Assistente Codex
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-3">
            <div className="max-h-72 overflow-y-auto rounded-md border p-3 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={message.role === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={`inline-block max-w-[90%] rounded-md px-3 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="text-sm text-muted-foreground">Codex está pensando...</div>
              )}
            </div>

            <Textarea
              placeholder="Pergunte algo sobre seus gastos PF/PJ..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
            />

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open("https://chatgpt.com/auth/login", "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Entrar no ChatGPT
              </Button>

              <Button onClick={handleSend} disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        type="button"
        size="icon"
        className="fixed bottom-6 right-4 z-50 h-14 w-14 rounded-full shadow-xl"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={isOpen ? "Fechar assistente" : "Abrir assistente"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </Button>
    </>
  );
};
