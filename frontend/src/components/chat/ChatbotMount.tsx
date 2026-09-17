"use client";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// ── Route-conditional mounting ──────────────────────────────────────────
// Replaces the old in-component usePathname blocklist. FloatingChatbot is
// only MOUNTED on routes where the chat is visible, so its hooks never run
// on hidden routes and the old hooks-order workaround (early return after
// all hooks) is no longer needed.
//
// The hidden list preserves the old blocklist's intent exactly: the
// /lost-pet-intake page renders a FULL-PAGE intake chat surface
// (LostPetAgent) — the dedicated intake UI, not a folio of the global
// chatbot. Mounting the global FAB there also reproduced the "paperclip
// bug": the FAB (fixed bottom-6 right-6 z-[9999]) intercepted the clicks
// meant for the intake form's paperclip button (z-50). Hidden routes use
// exact pathname equality, matching the original check.
const HIDDEN_ROUTES = new Set<string>(["/lost-pet-intake"]);

// Client-only lazy load: ssr:false is not allowed in Server Components, so
// this client wrapper owns the dynamic import. FloatingChatbot (and its
// locale dictionaries) leave every route's initial JS bundle.
const FloatingChatbot = dynamic(() => import("./FloatingChatbot"), {
  ssr: false,
});

export default function ChatbotMount() {
  const pathname = usePathname();
  // A null pathname (transitional states) rendered the chatbot under the
  // old check too — preserve that.
  if (pathname !== null && HIDDEN_ROUTES.has(pathname)) return null;
  return <FloatingChatbot />;
}
