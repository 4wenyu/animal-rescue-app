"use client";

import { useEffect, useRef, useState } from "react";

import {
  clearLostPetDraft,
  readLostPetDraft,
  writeLostPetDraft,
  type DraftMessage,
} from "./lostPetDraft";

/**
 * Restore a lost-pet transcript after reload, then keep writing it.
 * Photos are never persisted.
 */
export function useLostPetDraft(args: {
  messages: DraftMessage[];
  accumulated: Record<string, unknown>;
  setMessages: (next: DraftMessage[] | ((prev: DraftMessage[]) => DraftMessage[])) => void;
  setAccumulated: (
    next:
      | Record<string, unknown>
      | ((prev: Record<string, unknown>) => Record<string, unknown>),
  ) => void;
}): { restored: boolean; clear: () => void } {
  const [restored, setRestored] = useState(false);
  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;
    const draft = readLostPetDraft();
    if (!draft) return;
    args.setMessages(draft.messages);
    args.setAccumulated(draft.accumulated);
    setRestored(true);
    // Restore exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didRestore.current) return;
    writeLostPetDraft(args.messages, args.accumulated);
  }, [args.messages, args.accumulated]);

  return { restored, clear: clearLostPetDraft };
}
