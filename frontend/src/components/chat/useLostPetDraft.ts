"use client";

import { useEffect, useRef, useState } from "react";

import {
  clearLostPetDraft,
  preferNewerDraft,
  readLostPetDraft,
  writeLostPetDraft,
  type DraftMessage,
  type LostPetDraft,
} from "./lostPetDraft";

const API = "/api/lost-pet-drafts";
const SAVE_DEBOUNCE_MS = 800;

async function fetchServerDraft(): Promise<LostPetDraft | null> {
  try {
    const res = await fetch(API, { method: "GET", credentials: "same-origin" });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as { draft?: LostPetDraft | null };
    return json.draft ?? null;
  } catch {
    return null;
  }
}

async function putServerDraft(
  messages: DraftMessage[],
  accumulated: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(API, {
      method: "PUT",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        accumulated,
        savedAt: Date.now(),
      }),
    });
  } catch {
    /* offline — localStorage still holds the draft */
  }
}

async function deleteServerDraft(): Promise<void> {
  try {
    await fetch(API, { method: "DELETE", credentials: "same-origin" });
  } catch {
    /* noop */
  }
}

/**
 * Restore a lost-pet transcript after reload (local + server for signed-in),
 * then keep writing both. Photos are never persisted.
 */
export function useLostPetDraft(args: {
  messages: DraftMessage[];
  accumulated: Record<string, unknown>;
  setMessages: (
    next: DraftMessage[] | ((prev: DraftMessage[]) => DraftMessage[]),
  ) => void;
  setAccumulated: (
    next:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ) => void;
}): { restored: boolean; clear: () => void } {
  const [restored, setRestored] = useState(false);
  const [saveReady, setSaveReady] = useState(false);
  const hydrateStarted = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hydrateStarted.current) return;
    hydrateStarted.current = true;

    let cancelled = false;
    (async () => {
      const local = readLostPetDraft();
      const server = await fetchServerDraft();
      if (cancelled) return;
      const chosen = preferNewerDraft(local, server);
      if (chosen) {
        args.setMessages(chosen.messages);
        args.setAccumulated(chosen.accumulated);
        writeLostPetDraft(chosen.messages, chosen.accumulated);
        if (server && local && local.savedAt > server.savedAt) {
          void putServerDraft(local.messages, local.accumulated);
        }
        setRestored(true);
      }
      setSaveReady(true);
    })();

    return () => {
      cancelled = true;
    };
    // Hydrate exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!saveReady) return;
    writeLostPetDraft(args.messages, args.accumulated);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void putServerDraft(args.messages, args.accumulated);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [saveReady, args.messages, args.accumulated]);

  return {
    restored,
    clear: () => {
      clearLostPetDraft();
      void deleteServerDraft();
    },
  };
}
