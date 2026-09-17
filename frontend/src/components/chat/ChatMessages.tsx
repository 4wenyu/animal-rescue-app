"use client";
import { useEffect, useRef } from "react";
import type { TranslateFn } from "./chatI18n";
import type { Message } from "./useChatState";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  t: TranslateFn;
}

/** Scrollable transcript: greeting fallback, bubbles, streaming dots. */
export default function ChatMessages({ messages, isLoading, t }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-3">
        {messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-slate-800 px-4 py-2.5 leading-relaxed text-slate-200">
              <p className="text-sm whitespace-pre-wrap">
                {t("chatbot.greeting")}
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                msg.role === "user"
                  ? "rounded-br-md bg-emerald-600 text-white"
                  : "rounded-bl-md bg-slate-800 text-slate-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-slate-800 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-500 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
