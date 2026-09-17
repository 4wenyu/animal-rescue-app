"use client";
import { useCallback, useRef, useState } from "react";

/** MIME allowlist + size cap. Same numbers as LostPetAgent: 5 MB and
 *  the canonical 5 image formats ai-sdk/google accepts. */
const ALLOWED_IMAGE_MIME = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface StagedImage {
  dataUrl: string;
  mimeType: string;
  filename: string;
  sizeBytes: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(reader.error ?? new Error("FileReader failed"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("FileReader returned a non-string result"));
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Vision attachment for the FloatingChatbot chat. Mirrors the same flow
 * shipped in LostPetAgent.tsx: hidden <input type=file>, ref-driven click,
 * mime + size allowlist, dataURL staging, optional parts[] forwarding on
 * submit. Staged images are cleared by the close/toggle handlers in
 * FloatingChatbot (the panel is short-lived conversational state), so a
 * ghost image never survives into the next session.
 */
export function useImageAttachment() {
  const [pendingImage, setPendingImage] = useState<StagedImage | null>(null);
  const [imageInputError, setImageInputError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setImageInputError(null);
      const file = e.target.files?.[0];
      // Reset selection so the same file can be re-picked after a reject.
      e.target.value = "";
      if (!file) return;

      if (!ALLOWED_IMAGE_MIME.has(file.type)) {
        setImageInputError(
          `Unsupported file type (${file.type || "unknown"}). Allowed: png, jpg, webp, gif.`,
        );
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        setImageInputError(
          `Image is too large (${mb} MB). Max is 5 MB — try a smaller photo.`,
        );
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[FloatingChatbot] file selected", {
          name: file.name,
          mime: file.type,
          bytes: file.size,
        });
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        setPendingImage({
          dataUrl,
          mimeType: file.type,
          filename: file.name,
          sizeBytes: file.size,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Could not read the file";
        setImageInputError(`Could not attach the image: ${msg}`);
      }
    },
    [],
  );

  const clearPendingImage = useCallback(() => {
    setPendingImage(null);
    setImageInputError(null);
  }, []);

  return {
    pendingImage,
    setPendingImage,
    imageInputError,
    setImageInputError,
    fileInputRef,
    handleFileSelected,
    clearPendingImage,
  };
}
