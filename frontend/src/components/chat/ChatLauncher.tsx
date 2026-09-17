"use client";
import { MessageCircle, X } from "lucide-react";
import type { TranslateFn } from "./chatI18n";

interface ChatLauncherProps {
  isOpen: boolean;
  onToggle: () => void;
  t: TranslateFn;
}

/** Fixed bottom-right FAB that opens/closes the chat panel. */
export default function ChatLauncher({ isOpen, onToggle, t }: ChatLauncherProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isOpen ? t("chatbot.close_label") : t("chatbot.open_label")}
      aria-expanded={isOpen}
      className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white drop-shadow-lg transition hover:bg-emerald-400 active:scale-95"
    >
      {/* TODO(paperclip-bug): this FAB is `fixed bottom-6 right-6 z-[9999]`
          and hit-tests above ALL page content on every visible route. Any
          visible route that renders an interactive control in the
          bottom-right corner (e.g. a form's attach button around z-50)
          would reproduce the /lost-pet-intake click-interception bug: the
          FAB's onClick receives the pointer event before the page control.
          /lost-pet-intake itself is handled by the hidden-routes list in
          ChatbotMount. If overlap is reported on a visible route, fix it
          deliberately (lower z-index or per-route offset) — do not patch
          speculatively. */}
      {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
    </button>
  );
}
