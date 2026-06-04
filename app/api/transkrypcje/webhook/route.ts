import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillJob } from "@/lib/transkrypcje/fulfill";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature/secret" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Invalid signature: ${err}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // Payment Link przekazuje jobId w client_reference_id; Checkout API w metadata.
    const jobId = session.metadata?.jobId ?? session.client_reference_id ?? undefined;
    const email = session.customer_details?.email ?? session.customer_email;

    if (jobId && email) {
      // Odpowiadamy Stripe od razu, robota (audio+Whisper+Claude+PDF+mail) leci po response.
      after(async () => {
        try {
          await fulfillJob(jobId, email);
        } catch (err) {
          console.error("fulfillJob failed", jobId, err);
        }
      });
    }
  }

  return NextResponse.json({ received: true });
}
