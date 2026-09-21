/**
 * POST /api/fundraising/webhooks/stripe
 * =====================================
 * N4 — primary fulfill path for live card donations.
 * Verifies Stripe-Signature, handles checkout.session.completed,
 * and applies the pledge exactly once (FundraisingDonation unique key).
 */
import { NextResponse } from "next/server";

import { fulfillStripeCheckoutSession } from "@/lib/services/fundraisingPledge";
import { verifyStripeWebhookSignature } from "@/lib/stripeWebhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Not Configured", message: "STRIPE_WEBHOOK_SECRET is not set." },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!verifyStripeWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  let event: {
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json(
      { error: "Bad Request", message: "Invalid JSON." },
      { status: 400 },
    );
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const session = event.data?.object as
    | {
        id?: string;
        payment_status?: string;
        metadata?: { rosterId?: string; allocation?: string; amount?: string };
      }
    | undefined;

  if (!session?.id) {
    return NextResponse.json(
      { error: "Bad Request", message: "Missing checkout session." },
      { status: 400 },
    );
  }

  // Prefer paid; some Checkout events arrive before payment_status flips.
  const paymentStatus = session.payment_status ?? "paid";
  const result = await fulfillStripeCheckoutSession({
    id: session.id,
    payment_status: paymentStatus,
    metadata: session.metadata,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: "Unprocessable", reason: result.reason },
      { status: 422 },
    );
  }

  return NextResponse.json({
    ok: true,
    alreadyApplied: result.alreadyApplied,
    rosterId: result.rosterId,
  });
}
