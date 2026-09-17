"use client";
import { useCallback, useEffect, useState } from "react";
import type { TranslateFn } from "./chatI18n";
import type { StagedImage } from "./useImageAttachment";
import type { ChatSurface } from "@/lib/chatPrompts";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function nextId(): string {
  msgCounter += 1;
  return `msg-${msgCounter}-${Date.now()}`;
}

/** Transcript + composer state for the floating chatbot. */
export function useChatState(t: TranslateFn, surface: ChatSurface = "general") {
  const greetingKey =
    surface === "adopt" ? "chatbot.greeting_adopt" : "chatbot.greeting";
  // Seed the greeting for the current locale once, on first mount; further
  // renders keep the existing transcript intact.
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "initial-greeting",
      role: "assistant",
      content: t(greetingKey),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Re-translate the greeting whenever the locale changes — but only while
  // the user has not yet sent any message (the transcript is still just the
  // greeting). Once the conversation started, the transcript stays intact.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === "initial-greeting") {
        return [{ ...prev[0]!, content: t(greetingKey) }];
      }
      return prev;
    });
  }, [t, greetingKey]);

  const sendMessage = useCallback(
    async (text: string, stagedImage?: StagedImage | null) => {
      const userMsg: Message = { id: nextId(), role: "user", content: text };
      const assistantId = nextId();

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        // Build the messages[] payload. When a staged image is attached the
        // LAST user message is upgraded to AI SDK `parts[]` carrying both a
        // text part and an image part inline (DataURL + mediaType); earlier
        // turns stay plain strings so repeated photo exchanges don't bloat
        // every turn's payload. Mirrors LostPetAgent.handleSubmit
        // byte-for-byte.
        const conversation = [...messages, userMsg];
        const messagesPayload = stagedImage
          ? [
              ...conversation
                .slice(0, -1)
                .map((m) => ({ role: m.role, content: m.content })),
              {
                role: "user" as const,
                content: [
                  { type: "text" as const, text },
                  {
                    type: "image" as const,
                    image: stagedImage.dataUrl,
                    mediaType: stagedImage.mimeType,
                  },
                ],
              },
            ]
          : conversation.map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesPayload, surface }),
        });

        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${res.statusText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        // Insert the assistant message stub right away
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m,
            ),
          );
        }
      } catch (err) {
        console.error("🚨 Chat fetch error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: t("chatbot.error", {
              error: err instanceof Error ? err.message : "Unknown error",
            }),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, t, surface],
  );

  return { messages, input, setInput, isLoading, sendMessage };
}
