"use client";
import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { useChatLocale } from "./chatI18n";
import { useChatState } from "./useChatState";
import { useImageAttachment } from "./useImageAttachment";
import { chatSurfaceFromPath } from "@/lib/chatPrompts";
import ChatLauncher from "./ChatLauncher";
import ChatWindow from "./ChatWindow";

/**
 * FloatingChatbot — global chat FAB + panel (RescueHub Assistant).
 * Split into chatI18n / useChatState / useImageAttachment / ChatLauncher /
 * ChatWindow / ChatMessages / ChatComposer; route-conditional mounting
 * lives in ChatbotMount, which only renders this component on routes where
 * the chat is visible (the /lost-pet-intake intake surface owns that page's
 * chat UI, so this component is never mounted there).
 */
export default function FloatingChatbot() {
  const { t } = useChatLocale();
  const pathname = usePathname();
  const surface = chatSurfaceFromPath(pathname);
  const { messages, input, setInput, isLoading, sendMessage } = useChatState(
    t,
    surface,
  );
  const {
    pendingImage,
    setPendingImage,
    imageInputError,
    setImageInputError,
    fileInputRef,
    handleFileSelected,
    clearPendingImage,
  } = useImageAttachment();
  const [isOpen, setIsOpen] = useState(false);

  // Closing the panel (toggle or X) clears any staged image + error — the
  // panel is short-lived conversational state, so picking an image then
  // closing won't retain a ghost image into the next session.
  const closeChat = useCallback(() => {
    setIsOpen(false);
    clearPendingImage();
  }, [clearPendingImage]);

  const toggleChat = useCallback(() => {
    if (isOpen) clearPendingImage();
    setIsOpen(!isOpen);
  }, [isOpen, clearPendingImage]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      // Empty-text guard: allow pure image submissions (image-only is
      // valid), but block if there's nothing to send at all. Mirrors the
      // guard shipped in LostPetAgent.handleSubmit.
      if ((!text && !pendingImage) || isLoading) return;
      const staged = pendingImage;
      // Clear staged image synchronously before async work — even if the
      // request rejects, the UI shows a non-image-only state on retry.
      setPendingImage(null);
      setImageInputError(null);
      sendMessage(text, staged);
    },
    [input, isLoading, sendMessage, pendingImage, setPendingImage, setImageInputError],
  );

  return (
    <>
      {isOpen && (
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          input={input}
          setInput={setInput}
          pendingImage={pendingImage}
          imageInputError={imageInputError}
          onDismissError={() => setImageInputError(null)}
          fileInputRef={fileInputRef}
          onFileSelected={handleFileSelected}
          onClearImage={clearPendingImage}
          onSubmit={handleSubmit}
          onClose={closeChat}
          t={t}
        />
      )}

      <ChatLauncher isOpen={isOpen} onToggle={toggleChat} t={t} />
    </>
  );
}
