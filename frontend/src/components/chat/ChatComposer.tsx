"use client";
import { AlertTriangle, Paperclip, Send, X } from "lucide-react";
import type { TranslateFn } from "./chatI18n";
import type { StagedImage } from "./useImageAttachment";

interface ChatComposerProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  pendingImage: StagedImage | null;
  imageInputError: string | null;
  onDismissError: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  t: TranslateFn;
}

/** Input row: staged-image chip, error chip, hidden file input, form. */
export default function ChatComposer({
  input,
  setInput,
  isLoading,
  pendingImage,
  imageInputError,
  onDismissError,
  fileInputRef,
  onFileSelected,
  onClearImage,
  onSubmit,
  t,
}: ChatComposerProps) {
  return (
    <div className="border-t border-slate-700 p-3">
      {/* Image preview chip — appears above the input row when
          the user has staged a file via the paperclip. */}
      {pendingImage && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/80 px-2.5 py-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pendingImage.dataUrl}
            alt={pendingImage.filename}
            className="h-7 w-7 shrink-0 rounded-md border border-slate-600 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium text-slate-200">
              {pendingImage.filename}
            </p>
            <p className="text-[10px] text-slate-500">
              {(pendingImage.sizeBytes / 1024).toFixed(0)} KB · {pendingImage.mimeType}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearImage}
            aria-label="Remove attached image"
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-700 hover:text-slate-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Image-input error chip — rendered when upload validation rejects. */}
      {imageInputError && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-rose-700/60 bg-rose-950/70 px-2.5 py-1.5 text-[11px] text-rose-200">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span className="flex-1 truncate">{imageInputError}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss image error"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-rose-300 hover:bg-rose-900/40"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      )}

      {/* Hidden file input — driven by the paperclip. `sr-only` replaces the
          former inline clip/clip-path styles with the same 4-layer visibility
          stack so the imperative .click() opens the OS picker reliably.
          Mirrors LostPetAgent's <input> rendering. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={onFileSelected}
        className="pointer-events-none sr-only opacity-0"
        aria-hidden="true"
        tabIndex={-1}
      />
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            // SYNCHRONOUS paperclip handler. Inline arrow guarantees
            // the .click() lives inside the user-gesture handler
            // reference, which clears the browser-gesture gate for
            // <input type="file"> imperative activation.
            if (process.env.NODE_ENV !== "production") {
              console.log("[FloatingChatbot] Paperclip clicked", {
                refAttached: fileInputRef.current !== null,
                refType:
                  fileInputRef.current?.constructor?.name ?? null,
              });
            }
            try {
              fileInputRef.current?.click();
            } catch (err) {
              if (process.env.NODE_ENV !== "production") {
                console.error(
                  "[FloatingChatbot] paperclip click() threw:",
                  err,
                );
              }
            }
          }}
          disabled={isLoading}
          aria-label={t("chatbot.attach_label")}
          className="relative z-50 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-600 bg-slate-800 text-slate-400 transition hover:border-emerald-500 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatbot.input_placeholder")}
          className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          aria-label={t("chatbot.send_label")}
          disabled={(!input.trim() && !pendingImage) || isLoading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 active:scale-[0.95] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
