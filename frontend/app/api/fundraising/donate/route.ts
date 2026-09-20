/**
 * POST /api/fundraising/donate
 * Preview: records a labeled pledge (no card). Live: Stripe Checkout when
 * STRIPE_SECRET_KEY is set; otherwise refuse so we never fake money.
 */
import { NextResponse } from "next/server";

import { parseJsonBody } from "@/lib/api/helpers";
import { DonateBodySchema } from "@/lib/fundraisingDonate";
import { applyFundraisingPledge } from "@/lib/services/fundraisingPledge";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isPreviewMode } from "@/lib/siteMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { ok: withinLimit, retryAfterSeconds } = checkRateLimit(
    `fundraising-donate:${ip}`,
    10,
    10 * 60 * 1000,
  );
  if (!withinLimit) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const body = await parseJsonBody(request, DonateBodySchema);
  if (!body.ok) return body.response;

  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!isPreviewMode() && stripeKey) {
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
      new URL(request.url).origin;
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${origin}/api/fundraising/confirm?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${origin}/fundraising/${body.data.rosterId}`);
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", "usd");
    params.set(
      "line_items[0][price_data][unit_amount]",
      String(Math.round(body.data.amount * 100)),
    );
    params.set(
      "line_items[0][price_data][product_data][name]",
      `RescueHub care fund (${body.data.allocation})`,
    );
    params.set("metadata[rosterId]", String(body.data.rosterId));
    params.set("metadata[allocation]", body.data.allocation);
    params.set("metadata[amount]", String(body.data.amount));

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });
    if (!stripeRes.ok) {
      return NextResponse.json(
        { error: "Bad Gateway", message: "Could not start card checkout." },
        { status: 502 },
      );
    }
    const session = (await stripeRes.json()) as { url?: string };
    if (!session.url) {
      return NextResponse.json(
        { error: "Bad Gateway", message: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, checkoutUrl: session.url });
  }

  if (!isPreviewMode()) {
    return NextResponse.json(
      {
        error: "Not Configured",
        message: "Card donations are not enabled. Email the shelter to give.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await applyFundraisingPledge(body.data);
    if (!result) {
      return NextResponse.json(
        { error: "Not Found", message: "That animal is not on the roster." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        ok: true,
        preview: true,
        balance: Number(result.wallet.currentBalance),
        animalId: result.animalId,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Unavailable", message: "Could not record this donation." },
      { status: 503 },
    );
  }
}
