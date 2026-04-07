import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { stripePortalSchema } from "@/lib/validation";
import { logError, logRequest } from "@/lib/logger";

/* ------------------------------------------------------------------ */
/*  POST /api/stripe/portal                                            */
/*  Creates a Stripe Customer Portal session (or demo fallback)        */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  logRequest(request);
  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = stripePortalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Customer ID is required." },
        { status: 400 }
      );
    }
    const { customerId } = parsed.data;

    // Verify the session user owns this customer ID
    if (customerId !== "demo") {
      const supabase = getServiceSupabase();
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", (authSession.user as { id?: string }).id)
        .single();

      if (profile?.stripe_customer_id !== customerId) {
        return NextResponse.json(
          { error: "Unauthorized: customer ID does not match." },
          { status: 403 }
        );
      }
    }

    /* -------------------------------------------------------------- */
    /*  Demo mode — no Stripe key configured                           */
    /* -------------------------------------------------------------- */

    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey || customerId === "demo") {
      return NextResponse.json({
        url: "/pricing/manage",
        demo: true,
        message:
          "Running in demo mode. Configure STRIPE_SECRET_KEY for production billing portal.",
      });
    }

    /* -------------------------------------------------------------- */
    /*  Production — create a real Stripe billing portal session        */
    /* -------------------------------------------------------------- */

    // Dynamic import so the app doesn't crash if stripe isn't installed
    // in environments that only need the demo path.
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2026-02-25.clover",
    });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://keithlodom.io"}/pricing/manage`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError(error, { endpoint: '/api/stripe/portal' });

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return NextResponse.json(
      { error: `Failed to create billing portal session: ${message}` },
      { status: 500 }
    );
  }
}
