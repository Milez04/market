import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const quantity = Number(body.quantity ?? 250);
  const finish = String(body.finish ?? "foil");
  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/designer/${body.projectId ?? "new"}?checkout=cancelled`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.max(2900, quantity * 18),
          product_data: {
            name: `CardForge 3D ${finish} card order`,
            description: `${quantity} professional cards with live 3D proof approval`,
          },
        },
      },
    ],
    metadata: {
      projectId: String(body.projectId ?? "new"),
      quantity: String(quantity),
      finish,
    },
  });

  return NextResponse.json({ url: session.url });
}
