import { NextResponse } from "next/server";

import { applyFundraisingPledge } from "@/lib/services/fundraisingPledge";
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
    payment_status?: string;
    metadata?: { rosterId?: string; allocation?: string; amount?: string };
  };
  if (session.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Payment Required", message: "Checkout is not paid yet." },
      { status: 402 },
    );
  }
  const rosterId = Number(session.metadata?.rosterId);
  const amount = Number(session.metadata?.amount);
  const allocation =
    session.metadata?.allocation === "medical" ? "medical" : "general";
  if (!Number.isInteger(rosterId) || !Number.isFinite(amount)) {
    return NextResponse.json(
      { error: "Bad Request", message: "Stripe metadata was incomplete." },
      { status: 400 },
    );
  }
  const wallet = await applyFundraisingPledge({ rosterId, amount, allocation });
  if (!wallet) {
    return NextResponse.json(
      { error: "Not Found", message: "Unknown animal." },
      { status: 404 },
    );
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return NextResponse.redirect(new URL(`/fundraising/${rosterId}?paid=1`, origin));
}
