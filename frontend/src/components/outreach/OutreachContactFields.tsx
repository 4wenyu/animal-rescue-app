"use client";

export function OutreachContactFields({
  telegramChatId,
  phone,
  onTelegram,
  onPhone,
  tr,
}: {
  telegramChatId: string;
  phone: string;
  onTelegram: (value: string) => void;
  onPhone: (value: string) => void;
  tr: (key: string) => string;
}) {
  return (
    <>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-slate-500">
        {tr("outreach.sms_label")}
      </label>
      <input
        value={phone}
        onChange={(e) => onPhone(e.target.value)}
        inputMode="tel"
        autoComplete="tel"
        placeholder={tr("outreach.sms_placeholder")}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
      <p className="mt-1 text-xs text-slate-500">{tr("outreach.sms_hint")}</p>

      <label className="mt-4 block text-xs font-semibold uppercase tracking-widest text-slate-500">
        {tr("outreach.telegram_label")}
      </label>
      <input
        value={telegramChatId}
        onChange={(e) => onTelegram(e.target.value)}
        placeholder={tr("outreach.telegram_placeholder")}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
      <p className="mt-1 text-xs text-slate-500">{tr("outreach.telegram_hint")}</p>
    </>
  );
}
