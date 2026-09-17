"use client";
import { X } from "lucide-react";
import type { TranslateFn } from "./chatI18n";
import ChatMessages from "./ChatMessages";
import ChatComposer from "./ChatComposer";
import type { Message } from "./useChatState";
import type { StagedImage } from "./useImageAttachment";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  input: string;
  setInput: (value: string) => void;
  pendingImage: StagedImage | null;
  imageInputError: string | null;
  onDismissError: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  onClose: () => void;
  t: TranslateFn;
}

/** Fixed chat panel: header, transcript, composer. */
export default function ChatWindow({
  messages,
  isLoading,
  input,
  setInput,
  pendingImage,
  imageInputError,
  onDismissError,
  fileInputRef,
  onFileSelected,
  onClearImage,
  onSubmit,
  onClose,
  t,
}: ChatWindowProps) {
  return (
    <div className="fixed bottom-24 right-6 z-[9999] flex h-[30rem] w-96 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <span className="text-sm font-bold tracking-tight text-white">
          {t("chatbot.title")}
        </span>
        <button
          onClick={onClose}
          aria-label={t("chatbot.close_label")}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-700 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ChatMessages messages={messages} isLoading={isLoading} t={t} />

      <ChatComposer
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        pendingImage={pendingImage}
        imageInputError={imageInputError}
        onDismissError={onDismissError}
        fileInputRef={fileInputRef}
        onFileSelected={onFileSelected}
        onClearImage={onClearImage}
        onSubmit={onSubmit}
        t={t}
      />
    </div>
  );
}
