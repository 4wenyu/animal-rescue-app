"use client";

import Link from "next/link";
import { ClipboardCheck, HeartPulse, Search, Sparkles } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { useI18n } from "@/src/lib/useI18n";

type Job = {
  href: string;
  icon: typeof Sparkles;
  title: string;
  body: string;
  onClick?: () => void;
};

export function TodayBoard({
  reviewCount,
  staff,
  onSearch,
}: {
  reviewCount: number;
  staff: boolean;
  onSearch: () => void;
}) {
  const { tr } = useI18n();

  const citizen: Job[] = [
    {
      href: "#play",
      icon: Sparkles,
      title: tr("dashboard.today_walk"),
      body: tr("dashboard.today_walk_body"),
    },
    {
      href: "#search",
      icon: Search,
      title: tr("dashboard.today_search"),
      body: tr("dashboard.today_search_body"),
      onClick: onSearch,
    },
  ];

  const jobs: Job[] = staff
    ? [
        ...citizen,
        {
          href: "/medical",
          icon: HeartPulse,
          title: tr("dashboard.today_medical"),
          body: tr("dashboard.today_medical_body", { count: reviewCount }),
        },
        {
          href: "/outreach/review",
          icon: ClipboardCheck,
          title: tr("dashboard.today_outreach"),
          body: tr("dashboard.today_outreach_body"),
        },
      ]
    : citizen;

  return (
    <section className="mb-8" aria-labelledby="today-title">
      <h2 id="today-title" className="mb-3 text-sm font-semibold text-slate-800">
        {tr("dashboard.today_title")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {jobs.map((job) => (
          <JobCard key={job.title} job={job} />
        ))}
      </div>
    </section>
  );
}

function JobCard({ job }: { job: Job }) {
  const Icon = job.icon;
  const className =
    "flex gap-3 rounded-2xl p-4 transition hover:border-emerald-300 hover:bg-emerald-50/60";

  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-900">{job.title}</span>
        <span className="mt-0.5 block text-sm text-slate-600">{job.body}</span>
      </span>
    </>
  );

  if (job.onClick) {
    return (
      <Card>
        <button type="button" onClick={job.onClick} className={`${className} w-full text-left`}>
          {inner}
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <Link href={job.href} className={className}>
        {inner}
      </Link>
    </Card>
  );
}
