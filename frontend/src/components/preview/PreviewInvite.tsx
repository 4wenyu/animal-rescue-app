"use client";

import Link from "next/link";
import { Heart, Search, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { useI18n } from "@/src/lib/useI18n";
import { CopyInviteLink } from "./CopyInviteLink";

const PATHS = [
  {
    href: "/#adopt",
    icon: Heart,
    titleKey: "preview.path_adopt_title",
    timeKey: "preview.path_adopt_time",
    bodyKey: "preview.path_adopt_body",
  },
  {
    href: "/lost-pet-intake",
    icon: Search,
    titleKey: "preview.path_lost_title",
    timeKey: "preview.path_lost_time",
    bodyKey: "preview.path_lost_body",
  },
  {
    href: "/login",
    icon: Shield,
    titleKey: "preview.path_staff_title",
    timeKey: "preview.path_staff_time",
    bodyKey: "preview.path_staff_body",
  },
] as const;

export function PreviewInvite() {
  const { tr } = useI18n();

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
        {tr("preview.kicker")}
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {tr("preview.title")}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
        {tr("preview.lede")}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CopyInviteLink idle={tr("preview.copy_link")} done={tr("preview.copied")} />
        <p className="text-xs text-slate-500">{tr("preview.share_hint")}</p>
      </div>

      <ul className="mt-10 grid gap-4">
        {PATHS.map(({ href, icon: Icon, titleKey, timeKey, bodyKey }) => (
          <li key={href}>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <CardTitle>{tr(titleKey)}</CardTitle>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {tr(timeKey)}
                    </p>
                  </div>
                </div>
                <Link
                  href={href}
                  className="shrink-0 rounded-xl bg-(--color-accent) px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  {tr("preview.cta_start")}
                </Link>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-slate-600">
                  {tr(bodyKey)}
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tr("preview.real_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600">
              {tr("preview.real_body")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{tr("preview.sim_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600">
              {tr("preview.sim_body")}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
