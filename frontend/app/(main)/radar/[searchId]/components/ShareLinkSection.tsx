/**
 * ShareLinkSection — mint-or-copy block of the ShareToEarnWidget.
 *
 * Before minting: the "Create share link" CTA. After: the tracking URL
 * with a copy button (clipboard-first, text-selection fallback handled by
 * the parent) and the post hint.
 */

import { Check, Copy, Link2, Loader2 } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

export function ShareLinkSection({
  creating,
  trackingUrl,
  copied,
  onCreate,
  onCopy,
}: {
  creating: boolean;
  trackingUrl: string | null;
  copied: boolean;
  onCreate: () => void;
  onCopy: () => void;
}) {
  const { tr } = useI18n();

  if (!trackingUrl) {
    return (
      <button
        type="button"
        onClick={onCreate}
        disabled={creating}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {creating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Link2 className="h-4 w-4" />
        )}
        {creating ? tr("radar.share_creating") : tr("radar.share_cta")}
      </button>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {tr("radar.share_link_label")}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <code
          id="share-track-url"
          className="min-w-0 flex-1 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-700"
          title={trackingUrl}
        >
          {trackingUrl}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? tr("radar.share_copied") : tr("radar.share_copy")}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{tr("radar.share_post_hint")}</p>
    </div>
  );
}
