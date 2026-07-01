import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = (await headers()).get("stripe-signature");
  const payload = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Missing Stripe webhook configuration" }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid webhook" }, { status: 400 });
  }
}
