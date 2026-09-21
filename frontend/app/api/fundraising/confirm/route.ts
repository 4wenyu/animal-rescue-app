/**
 * GET /api/fundraising/confirm
 * ============================
 * Success-URL fallback after Stripe Checkout. Primary fulfill is the
 * webhook (N4); this path re-checks the session and applies idempotently,
 * then redirects to the fundraising page.
 */
import { NextResponse } from "next/server";

import { fulfillStripeCheckoutSession } from "@/lib/services/fundraisingPledge";
import { isPreviewMode } from "@/lib/siteMode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (isPreviewMode() || !process.env.STRIPE_SECRET_KEY?.trim()) {
    return NextResponse.json(
      { error: "Not Configured", message: "Stripe confirmation is live-mode only." },
      { status: 503 },
    );
  }
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json(
      { error: "Bad Request", message: "session_id is required." },
      { status: 400 },
    );
  }

  const stripeRes = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY.trim()}`,
      },
    },
  );
  if (!stripeRes.ok) {
    return NextResponse.json(
      { error: "Bad Gateway", message: "Could not verify Stripe session." },
      { status: 502 },
    );
  }
  const session = (await stripeRes.json()) as {
    id?: string;
    payment_status?: string;
    metadata?: { rosterId?: string; allocation?: string; amount?: string };
  };
  if (session.payment_status !== "paid" || !session.id) {
    return NextResponse.json(
      { error: "Payment Required", message: "Checkout is not paid yet." },
      { status: 402 },
    );
  }

  const result = await fulfillStripeCheckoutSession({
    id: session.id,
    payment_status: session.payment_status,
    metadata: session.metadata,
  });
  if (!result.ok) {
    const status = result.reason === "unknown-animal" ? 404 : 400;
    return NextResponse.json(
      {
        error: status === 404 ? "Not Found" : "Bad Request",
        message:
          result.reason === "unknown-animal"
            ? "Unknown animal."
            : "Stripe metadata was incomplete.",
      },
      { status },
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return NextResponse.redirect(
    new URL(`/fundraising/${result.rosterId}?paid=1`, origin),
  );
}
