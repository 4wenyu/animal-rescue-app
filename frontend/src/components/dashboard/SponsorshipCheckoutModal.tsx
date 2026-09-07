"use client";

/**
 * SponsorshipCheckoutModal
 * ========================
 * Compliant sponsor-acknowledgment flow that gates a free Lost Pet Search
 * grant behind an IRC § 513(i) — neutral acknowledgment view of a Chewy
 * sponsor message.
 *
 * Step topology (strict, two distinct POSTs to /api/tokens/transaction):
 *   1. Step 1 — `SPONSOR_VIEW_CREDIT_EARN` (+50) issued ONLY AFTER the
 *      user has viewed the sponsor video for the mandated countdown.
 *      A deterministic idempotencyKey is generated at mount time so
 *      remounts and accidental double-clicks collapse to one ledger row.
 *   2. Step 2 — `LOST_PET_SEARCH_SPEND` (-100) issued immediately after
 *      Step 1 succeeds. The pre-flight rule in this component blocks the
 *      call entirely IF `currentBalance + 50 < 100`, i.e. self-funded
 *      users without enough headroom for a post-grant SPEND.
 *
 * If the user clicks Find My Pet without enough balance to cover the
 * +50 grant + a 100-token spend, the modal renders an explicit "Insufficient
 * wallet balance" view and never issues either POST.
 *
 * Compliance constraints honored:
 *   - NEUTRAL_ACKNOWLEDGMENT language only — no CTA on Chewy, no implied
 *     endorsement, no advertising voice.
 *   - Sponsor message is a static, value-neutral factual notice; the
 *     iframe URL is a generic YouTube placeholder sweet Spot explains at
 *     youtube-nocookie.com (privacy-enhanced, no tracking cookies).
 *   - The SPONSOR_VIEW_CREDIT_EARN row is EARNED CORPORATE-FUNDED value;
 *     api/tokens/transaction does attribution via sponsorOrgId; tokenService
 *     downstream can do the UBIT accounting in a future patch — UI surface
 *     here does not promise revenue treatment in either direction.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  Coins,
  HeartHandshake,
  Loader2,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/src/lib/useI18n";

/* -------------------------------------------------------------------------- */
/* Constants / configuration                                                  */
/* -------------------------------------------------------------------------- */

/** Duration the user must view the sponsor message before Step 1 can fire. */
const SPONSOR_VIEW_SECONDS = 5;

/**
 * The sponsor message is rendered as a static, value-neutral acknowledgment
 * panel (no embedded video). An unrelated placeholder cartoon previously
 * read as a fake "sponsor video" under a real brand name (review §4.2 #159);
 * the neutral acknowledgment text itself is the message the user views for
 * the mandated countdown, with no CTA and no external asset.
 */

/**
 * sponsorOrgId is intentionally LEFT NULL on the SPONSOR_VIEW_CREDIT_EARN
 * row for now. The FK target requires an `Organization` row; production
 * sponsor onboarding (Phase 3) will pre-seed Chewy's Organization +
 * Sponsor rows so this field can be propagated for UBIT IRC § 513(i)
 * attribution. Today the ledger row only needs to capture that the user
 * acknowledged sponsor X — the rule "value flows sponsor -> user as
 * acknowledgment, NOT ad remuneration" still holds; the API can derive
 * brand context later from the idempotencyKey/notes trace.
 */

/**
 * Sprint B — 0-balance start.
 *
 * Previously the sponsor grant was 50 tokens against a 100-token search
 * fee, and the pre-flight `currentBalance + 50 >= 100` blocked anyone who
 * held fewer than 50 tokens — a brand-new owner with an empty wallet
 * could not start a search. The sponsor acknowledgment now GRANTS the
 * full search fee (100 = SEARCH_FEE_AMOUNT), so a 0-balance user goes
 * 0 → +100 → −100 → 0 and the search is sponsor-funded. The pre-flight
 * (`balance + grant >= fee`) therefore passes for any non-negative
 * balance.
 */
const SPONSOR_CREDIT_AMOUNT = 100; // == SEARCH_FEE_AMOUNT (sponsor funds the search)
const SEARCH_FEE_AMOUNT = 100;

/**
 * NEUTRAL_SPONSOR_COPY removed — sponsor body copy is now resolved at render
 * time via `useI18n().tr("sponsorModal.body_translated" | "sponsorModal.body")`
 * (the latter is the canonical English constant kept as a reference fallback).
 * The brand proper noun "Chewy" stays untranslated across all locales per the
 * IRC § 513(i) NEUTRAL_ACKNOWLEDGMENT requirement that compliant sponsored
 * content remain strictly value-neutral and identical in factual substance
 * across languages. The localized phrasing only translates the wrapper text;
 * the brand and the "50-token search grant" factual claim are preserved.
 */

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export interface SponsorshipCheckoutModalProps {
  open: boolean;
  /** Current cachedBalance from the TokenWallet, fed by the parent. */
  currentBalance: number;
  /** Called when the modal should close for any reason other than success. */
  onClose: () => void;
  /**
   * Called after Step 2 (LOST_PET_SEARCH_SPEND) returns 2xx. The parent is
   * expected to dispatch the `tokenwallet:refresh` window event AND navigate
   * to the Lost Pet Search flow.
   */
  onSearchGranted: (result: SearchGrantSuccess) => void;
}

export interface SearchGrantSuccess {
  creditTxnId: string;
  spendTxnId: string;
  newBalance: number;
}

type ModalPhase =
  | "viewing_sponsor"
  | "issuing_credit"
  | "spending"
  | "success"
  | "insufficient_funds";

interface TxResponse {
  ok: boolean;
  idempotentReplay?: boolean;
  wallet: { cachedBalance: number };
  transaction: {
    txnId: string;
    direction: "EARN" | "SPEND" | "EXPIRE" | "REFUND";
    actionType: string;
    amount: number;
    balanceAfter: number;
  };
}

/* -------------------------------------------------------------------------- */
/* POST /api/tokens/transaction helper                                         */
/* -------------------------------------------------------------------------- */

async function postTransaction(
  body: Record<string, unknown>
): Promise<TxResponse> {
  const res = await fetch("/api/tokens/transaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as TxResponse | null;
  if (!res.ok || !json) {
    const message =
      (json as unknown as { message?: string } | null)?.message ??
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  return json;
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

function makeIdempotencyKey(prefix: string): string {
  // Deterministic-ish per-modal-mount, scoped to the userId when available.
  // The tokenService treats idempotencyKey as the absolute source of
  // double-spend truth, so even a single accidental double-fire of Step 1
  // collapses through P2002 → idempotent replay.
  const uuid =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${uuid}`;
}

export function SponsorshipCheckoutModal({
  open,
  currentBalance,
  onClose,
  onSearchGranted,
}: SponsorshipCheckoutModalProps) {
  /* ---- i18n ------------------------------------------------------------ */
  const { tr, locale } = useI18n();

  /* ---- Helper: locale-specific NEUTRAL_SPONSOR body -------------------- */
  // Resolve the `sponsorModal.body_translated` key when present (non-English
  // locales provide a translation); fall back to the canonical `body`
  // constant which is kept verbatim across locales because the IRC § 513(i)
  // neutral-acknowledgment text must remain factually identical and the
  // brand "Chewy" itself is a proper noun that is never translated.
  const localeSponsorBody = useMemo(() => {
    const translated = tr("sponsorModal.body_translated");
    // On locale miss `tr` returns the key itself (e.g. for English which has
    // no `body_translated` entry). When that happens, fall back to the canon.
    return translated === "sponsorModal.body_translated"
      ? tr("sponsorModal.body")
      : translated;
  }, [tr, locale]);

  /* ---- Countdown ------------------------------------------------------- */
  const [secondsRemaining, setSecondsRemaining] = useState(SPONSOR_VIEW_SECONDS);
  const [countdownComplete, setCountdownComplete] = useState(false);

  /* ---- Workflow phase --------------------------------------------------- */
  const [phase, setPhase] = useState<ModalPhase>("viewing_sponsor");
  const [error, setError] = useState<string | null>(null);

  /* ---- Stable idempotency keys for this mount --------------------------- */
  // Initialized in an effect (not during render): refs must not be written
  // during render under the React Compiler rules. Effects run before any
  // user interaction, so the keys are guaranteed present by the time the
  // confirm handler reads them.
  const creditKeyRef = useRef<string>("");
  const spendKeyRef = useRef<string>("");
  useEffect(() => {
    if (open && !creditKeyRef.current) {
      creditKeyRef.current = makeIdempotencyKey("sponsorship-credit");
      spendKeyRef.current = makeIdempotencyKey("lost-pet-search-spend");
    }
  }, [open]);

  /* ---- Pre-flight: client-side Insufficient Funds gate ----------------- */
  // Strict rule from requirements: currentBalance + 50 < 100 ⇒ block.
  // Equivalent to currentBalance < 50 — i.e. the user must already hold
  // 50 tokens before the grant so they can cover the post-grant 100 SPEND.
  const canAfford = useMemo(
    () => currentBalance + SPONSOR_CREDIT_AMOUNT >= SEARCH_FEE_AMOUNT,
    [currentBalance]
  );

  /* ---- Countdown side effects ------------------------------------------ */
  useEffect(() => {
    if (!open) return;
    setSecondsRemaining(SPONSOR_VIEW_SECONDS);
    setCountdownComplete(false);
    setPhase("viewing_sponsor");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open || phase !== "viewing_sponsor") return;
    if (countdownComplete) return;
    if (secondsRemaining <= 0) {
      setCountdownComplete(true);
      return;
    }
    const id = window.setTimeout(
      () => setSecondsRemaining((s) => s - 1),
      1000
    );
    return () => window.clearTimeout(id);
  }, [open, phase, secondsRemaining, countdownComplete]);

  /* ---- Apply insufficient-funds override at mount ---------------------- */
  useEffect(() => {
    if (!open) return;
    if (!canAfford) setPhase("insufficient_funds");
    // Intentionally only depends on `open` and `canAfford` — we lock this
    // decision at mount so a later balance update can't cause a mid-flight
    // reclassification.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canAfford]);

  /* ---- Issuing ------------------------------------------------------- */
  const runTransactions = useCallback(async () => {
    if (phase === "insufficient_funds") return;

    setError(null);

    // ── Step 1: Sponsorship view credit (+50) ────────────────────────────
    setPhase("issuing_credit");
    let creditTxnId = "";
    try {
      const creditRes = await postTransaction({
        direction: "EARN",
        actionType: "SPONSOR_VIEW_CREDIT_EARN",
        amount: SPONSOR_CREDIT_AMOUNT,
        idempotencyKey: creditKeyRef.current,
        currency: "USD",
        notes: "Sponsor acknowledgment credit — Chewy (Lost Pet Search program).",
      });
      creditTxnId = creditRes.transaction.txnId;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(`Could not issue sponsor credit: ${msg}`);
      setPhase("viewing_sponsor");
      return;
    }

    // ── Step 2: Lost Pet Search spend (-100) ─────────────────────────────
    setPhase("spending");
    let spendTxnId = "";
    let newBalance = 0;
    try {
      const spendRes = await postTransaction({
        direction: "SPEND",
        actionType: "LOST_PET_SEARCH_SPEND",
        amount: SEARCH_FEE_AMOUNT,
        idempotencyKey: spendKeyRef.current,
        currency: "USD",
        notes: "Lost Pet Search service — grant + self-funded.",
      });
      spendTxnId = spendRes.transaction.txnId;
      newBalance = spendRes.wallet.cachedBalance;
    } catch (e) {
      // The +50 credit is committed; we surface the failure cleanly and let
      // the user retry Step 2 only (idempotencyKey stabilizes against double
      // charging). We do NOT auto-reverse — admin can run a manual reversal.
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(
        `Sponsor credit was issued, but the search fee spend failed: ${msg}. ` +
          "You can retry to complete the search."
      );
      setPhase("viewing_sponsor");
      return;
    }

    setPhase("success");
    onSearchGranted({ creditTxnId, spendTxnId, newBalance });
  }, [phase, onSearchGranted]);

  const handleAcknowledgeAndContinue = useCallback(() => {
    if (!countdownComplete) return;
    void runTransactions();
  }, [countdownComplete, runTransactions]);

  const handleClose = useCallback(() => {
    setPhase("viewing_sponsor");
    setError(null);
    onClose();
  }, [onClose]);

  /* ---- Accessibility: focus management (WCAG 2.1.1 / 2.4.3) -------------
     - Focus the dialog panel when it opens.
     - Restore focus to the trigger element when it closes.
     - Trap Tab/Shift+Tab inside the panel (no tabbing into the page behind
       the modal while it is open).
     - Close on Escape.
     All refs are only touched inside effects/handlers (never during render)
     so the react-hooks/refs rule stays satisfied. */
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    // Remember the element that opened the modal so we can restore focus.
    const previousActive = document.activeElement as HTMLElement | null;
    // Move focus into the dialog (close button is the first tab stop).
    closeButtonRef.current?.focus();
    return () => {
      previousActive?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        ),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, handleClose]);

  /* ---- Compose ------------------------------------------------------- */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="sponsorship-modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          onClick={handleClose}
          role="presentation"
        >
          <motion.div
            key="sponsorship-modal-panel"
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sponsorship-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Close button ─────────────────────────────────────────── */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label={tr("sponsorModal.close_aria_label")}
            >
              <X className="h-4 w-4" />
            </button>

            {/* ── Header / value-neutral sponsor notice ────────────────── */}
            <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    {tr("sponsorModal.eyebrow")}
                  </p>
                  <h2
                    id="sponsorship-modal-title"
                    className="mt-0.5 text-lg font-semibold text-slate-900"
                  >
                    {tr("sponsorModal.title")}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {localeSponsorBody}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Body — varies by phase ───────────────────────────────── */}
            {phase === "insufficient_funds" ? (
              <InsufficientFundsView
                currentBalance={currentBalance}
                tr={tr}
              />
            ) : phase === "success" ? (
              <SuccessView tr={tr} />
            ) : (
              <SponsorViewFlow
                secondsRemaining={secondsRemaining}
                countdownComplete={countdownComplete}
                isBusy={
                  phase === "issuing_credit" || phase === "spending"
                }
                error={error}
                sponsorBody={localeSponsorBody}
                onAcknowledge={handleAcknowledgeAndContinue}
                tr={tr}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Subviews                                                                   */
/* -------------------------------------------------------------------------- */

function SponsorViewFlow({
  secondsRemaining,
  countdownComplete,
  isBusy,
  error,
  sponsorBody,
  onAcknowledge,
  tr,
}: {
  secondsRemaining: number;
  countdownComplete: boolean;
  isBusy: boolean;
  error: string | null;
  sponsorBody: string;
  onAcknowledge: () => void;
  tr: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <>
      <div className="px-6 pt-5">
        {/* Honest sponsor acknowledgment — a static, value-neutral notice.
            No embedded video (a placeholder cartoon read as deceptive, review
            §4.2/#159). The acknowledgment text itself is the message the user
            views during the countdown; no CTA, no external asset. */}
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-700">
              {sponsorBody}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 shadow-sm">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              {tr("sponsorModal.static_ack_badge")}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 pt-5">
        <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
          <div className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>
              {tr("sponsorModal.value_neutral_compliance_badge")}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold tabular-nums text-slate-600">
            {countdownComplete ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {tr("sponsorModal.countdown_viewed")}
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                {tr("sponsorModal.countdown_remaining", { seconds: secondsRemaining })}
              </>
            )}
          </span>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={onAcknowledge}
          disabled={!countdownComplete || isBusy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
        >
          {isBusy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isBusy && countdownComplete
                ? tr("sponsorModal.processing_button_qualified")
                : tr("sponsorModal.processing_button_default")}
            </>
          ) : (
            <>
              <Coins className="h-4 w-4" />
              {tr("sponsorModal.acknowledge_button_idle")}
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          {tr("sponsorModal.ack_disclaimer")}
        </p>
      </div>
    </>
  );
}

function InsufficientFundsView({
  currentBalance,
  tr,
}: {
  currentBalance: number;
  tr: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const formattedBalance = currentBalance.toLocaleString();
  return (
    <div className="px-6 py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
        <Search className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">
        {tr("sponsorModal.insufficient_title")}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        {tr("sponsorModal.insufficient_body", { balance: formattedBalance })}
      </p>
      <a
        href="/dashboard"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-500 active:scale-[0.98]"
      >
        <Search className="h-4 w-4" />
        {tr("sponsorModal.earn_path_cta")}
      </a>
      <p className="mx-auto mt-4 max-w-md text-xs text-slate-400">
        {tr("sponsorModal.insufficient_footnote")}
      </p>
    </div>
  );
}

function SuccessView({
  tr,
}: {
  tr: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">
        {tr("sponsorModal.success_title")}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
        {tr("sponsorModal.success_body")}
      </p>
    </div>
  );
}
