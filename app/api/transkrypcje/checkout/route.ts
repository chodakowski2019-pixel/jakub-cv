import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStripe, PRICE_PROMO, PRICE_FULL, PROMO_WINDOW_SECONDS } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { jobId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const jobId = (body.jobId ?? "").trim();
  if (!jobId) return NextResponse.json({ error: "Brak jobId" }, { status: 400 });

  const { data: job, error } = await supabaseAdmin
    .from("transkrypcje_jobs")
    .select("id, url, created_at, status")
    .eq("id", jobId)
    .single();
  if (error || !job) return NextResponse.json({ error: "Nie znaleziono" }, { status: 404 });

  // Cena liczona SERWEROWO z czasu utworzenia joba (klient nie może oszukać).
  const elapsed = (Date.now() - new Date(job.created_at).getTime()) / 1000;
  const amount = elapsed <= PROMO_WINDOW_SECONDS ? PRICE_PROMO : PRICE_FULL;

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "pln",
          unit_amount: amount,
          product_data: {
            name: "Transkrypcja + analiza wideo (PDF na e-mail)",
            description: "Pełna transkrypcja, streszczenie i wyjaśnienie filmu z YouTube",
          },
        },
      },
    ],
    metadata: { jobId },
    success_url: `${origin}/transkrypcje?success=1`,
    cancel_url: `${origin}/transkrypcje?canceled=1`,
  });

  await supabaseAdmin
    .from("transkrypcje_jobs")
    .update({ amount, stripe_session_id: session.id })
    .eq("id", jobId);

  return NextResponse.json({ url: session.url });
}
