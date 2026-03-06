import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

/* ------------------------------------------------------------------ */
/*  POST /api/stripe/checkout                                          */
/*  Creates a Stripe Checkout session for a subscription purchase.     */
/* ------------------------------------------------------------------ */

interface CheckoutRequestBody {
  priceId: string;
  tier: "pro" | "executive";
}

export async function POST(request: NextRequest) {
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CheckoutRequestBody;
    const { priceId, tier } = body;

    if (!priceId || !tier) {
      return NextResponse.json(
        { error: "Missing required fields: priceId and tier" },
        { status: 400 }
      );
    }

    if (!["pro", "executive"].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Must be 'pro' or 'executive'." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/pricing/success?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing`;

    /* -------------------------------------------------------------- */
    /*  Demo / Test Mode                                               */
    /*  When no real Stripe key is configured or we are using a test   */
    /*  key, return a mock success URL so the frontend flow still      */
    /*  works during development.                                       */
    /* -------------------------------------------------------------- */
    const stripeKey = process.env.STRIPE_SECRET_KEY ?? "";
    const isDemoMode = !stripeKey || stripeKey.startsWith("sk_test");

    if (isDemoMode) {
      console.log(
        `[Stripe Demo] Mock checkout for tier="${tier}", priceId="${priceId}"`
      );
      return NextResponse.json({
        url: `${baseUrl}/pricing/success?tier=${tier}&session_id=demo_${Date.now()}`,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Production: Create a real Stripe Checkout session               */
    /* -------------------------------------------------------------- */
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tier },
      subscription_data: {
        metadata: { tier },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
