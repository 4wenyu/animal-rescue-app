"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, PawPrint, ChevronRight } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";
import { LocaleSwitch } from "@/src/components/LocaleSwitch";

/**
 * About pages — dynamic route backing the "About" dropdown (header + sidebar).
 *
 * The dropdown links to /about/{mission,legal,process,story,about-us,contact}.
 * Content lives in the locale JSON under `about.{slug}.{title,subtitle,body}`
 * (already translated into all 7 locales), so this page is a thin renderer:
 * it resolves the active locale, pulls the right strings, and lays them out.
 *
 * Unknown slugs render a localized "not found" card rather than crashing.
 */

const ABOUT_SLUGS = [
  "mission",
  "process",
  "story",
  "team",
  "partners",
  "faq",
  "about-us",
  "privacy",
  "terms",
  "careers",
  "legal",
  "contact",
] as const;

type AboutSlug = (typeof ABOUT_SLUGS)[number];

function isAboutSlug(value: string): value is AboutSlug {
  return (ABOUT_SLUGS as readonly string[]).includes(value);
}

/** Localized fallbacks for the unknown-slug state (not in the locale JSON). */
const NOT_FOUND = {
  en: { title: "Page not found", body: "This About page doesn't exist.", back: "Back to Home" },
  es: { title: "Página no encontrada", body: "Esta página de Acerca de no existe.", back: "Volver al inicio" },
  "zh-CN": { title: "页面未找到", body: "此“关于我们”页面不存在。", back: "返回首页" },
  "zh-TW": { title: "頁面未找到", body: "此「關於我們」頁面不存在。", back: "返回首頁" },
  ja: { title: "ページが見つかりません", body: "このAboutページは存在しません。", back: "ホームへ戻る" },
  ko: { title: "페이지를 찾을 수 없음", body: "이 About 페이지는 존재하지 않습니다.", back: "홈으로 돌아가기" },
} as const;

export default function AboutPage() {
  const params = useParams<{ slug: string }>();
  const { tr, locale } = useI18n();

  const slug = params.slug ?? "";
  const valid = isAboutSlug(slug);

  if (!valid) {
    const nf = NOT_FOUND[locale] ?? NOT_FOUND.en;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white px-6 text-center">
        <PawPrint className="h-12 w-12 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-800">{nf.title}</h1>
        <p className="text-sm text-slate-500">{nf.body}</p>
        <Link
          href="/"
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-700"
        >
          <ArrowLeft className="h-4 w-4" />
          {nf.back}
        </Link>
      </div>
    );
  }

  const title = tr(`about.${slug}.title`);
  const subtitle = tr(`about.${slug}.subtitle`);
  const body = tr(`about.${slug}.body`);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Header bar ───────────────────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            RescueHub
          </Link>
          <div className="flex items-center gap-2">
            <LocaleSwitch />
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-12">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <div className="p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <PawPrint className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
                <p className="text-sm text-slate-500">{subtitle}</p>
              </div>
            </div>

            <div className="mt-6 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
              {body}
            </div>
          </div>
        </div>

        {/* ── Footer nav ─────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <ChevronRight className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
