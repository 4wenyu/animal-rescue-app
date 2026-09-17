"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Building2, Shield } from "lucide-react";
import { useHomeLocale } from "./locale-store";

// Value-neutral name + mark only (IRC § 513(i)). Local wordmarks — no
// store links, slogans, pricing, or qualitative claims.
const SPONSORS = [
  {
    name: "Chewy",
    logo: "/sponsors/chewy.svg",
    description:
      "Chewy provides pet food, supplies, and pharmacy fulfillment services.",
  },
  {
    name: "Purina",
    logo: "/sponsors/purina.svg",
    description:
      "Purina produces grain-free, high-protein, and breed-specific dog food formulas.",
  },
  {
    name: "Petco",
    logo: "/sponsors/petco.svg",
    description:
      "Petco operates retail locations and veterinary services across the United States.",
  },
  {
    name: "Merrick",
    logo: "/sponsors/merrick.svg",
    description:
      "Merrick manufactures grain-free and limited-ingredient pet food sourced from Texas.",
  },
] as const;

export function Sponsors() {
  const { tr } = useHomeLocale();

  return (
    <section className="border-t border-slate-100 bg-slate-50/60">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-400" />
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {tr("sponsors.title")}
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {tr("sponsors.description")}
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {SPONSORS.map((sponsor, i) => (
            <motion.div
              key={sponsor.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="relative h-12 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  fill
                  unoptimized
                  className="object-contain p-1"
                  sizes="112px"
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {sponsor.name}
                </h3>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                  {sponsor.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs font-semibold text-slate-700">
                {tr("sponsors.compliance_title")}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                {tr("sponsors.compliance_body")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
