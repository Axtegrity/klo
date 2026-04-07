import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { getServiceSupabase } from "@/lib/supabase";
import { sendPushToUser } from "@/lib/push-server";
import { logError, logRequest } from "@/lib/logger";

/* ------------------------------------------------------------------ */
/*  POST /api/stripe/webhook                                           */
/*  Handles incoming Stripe webhook events.                            */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  logRequest(request);
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    logError(new Error('Missing stripe-signature header'), { endpoint: '/api/stripe/webhook' });
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logError(new Error('STRIPE_WEBHOOK_SECRET is not configured'), { endpoint: '/api/stripe/webhook' });
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Verify webhook signature                                         */
  /* ---------------------------------------------------------------- */
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logError(err, { endpoint: '/api/stripe/webhook', context: 'signature_verification' });
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Handle events                                                    */
  /* ---------------------------------------------------------------- */
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tier = session.metadata?.tier ?? "pro";
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log(
          `[Stripe Webhook] checkout.session.completed — ` +
            `customer=${customerId}, subscription=${subscriptionId}, tier=${tier}`
        );

        const supabaseCheckout = getServiceSupabase();
        const userId = session.client_reference_id;

        // Update by user ID (client_reference_id) since stripe_customer_id isn't set yet
        if (userId) {
          await supabaseCheckout
            .from("profiles")
            .update({
              subscription_tier: tier,
              stripe_customer_id: customerId,
            })
            .eq("id", userId);
        } else {
          // Fallback: try by stripe_customer_id for existing customers
          await supabaseCheckout
            .from("profiles")
            .update({
              subscription_tier: tier,
              stripe_customer_id: customerId,
            })
            .eq("stripe_customer_id", customerId);
        }

        // Push notification: subscription confirmed
        try {
          const profileId = userId;
          const { data: profile } = profileId
            ? { data: { id: profileId } }
            : await supabaseCheckout
                .from("profiles")
                .select("id")
                .eq("stripe_customer_id", customerId)
                .single();

          if (profile) {
            await sendPushToUser(profile.id, {
              title: "Welcome to KLO " + tier.charAt(0).toUpperCase() + tier.slice(1) + "!",
              body: "Your subscription is active. Explore your new features now.",
              url: "/vault",
              tag: "subscription-confirmed",
            });
          }
        } catch (pushErr) {
          logError(pushErr, { endpoint: '/api/stripe/webhook', context: 'push_notification', event: 'checkout.session.completed' });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const tier = subscription.metadata?.tier ?? "pro";
        const customerId = subscription.customer as string;
        const status = subscription.status;

        console.log(
          `[Stripe Webhook] customer.subscription.updated — ` +
            `customer=${customerId}, status=${status}, tier=${tier}`
        );

        const supabaseUpdate = getServiceSupabase();
        await supabaseUpdate
          .from("profiles")
          .update({
            subscription_tier: status === "active" ? tier : "free",
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(
          `[Stripe Webhook] customer.subscription.deleted — ` +
            `customer=${customerId}, downgrading to free tier`
        );

        const supabaseDelete = getServiceSupabase();
        await supabaseDelete
          .from("profiles")
          .update({
            subscription_tier: "free",
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const attemptCount = invoice.attempt_count;

        console.log(
          `[Stripe Webhook] invoice.payment_failed — ` +
            `customer=${customerId}, attempt=${attemptCount}`
        );

        const supabaseFailed = getServiceSupabase();
        await supabaseFailed
          .from("profiles")
          .update({
            payment_failed: true,
            payment_failed_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        // Push notification: payment issue
        try {
          const { data: failedProfile } = await supabaseFailed
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (failedProfile) {
            await sendPushToUser(failedProfile.id, {
              title: "Payment Issue",
              body: "We couldn't process your payment. Please update your payment method.",
              url: "/profile",
              tag: "payment-failed",
            });
          }
        } catch (pushErr) {
          logError(pushErr, { endpoint: '/api/stripe/webhook', context: 'push_notification', event: 'invoice.payment_failed' });
        }

        // Optionally notify user via Resend on final attempt
        if (attemptCount >= 3) {
          const customerEmail = invoice.customer_email;
          if (customerEmail) {
            try {
              const { Resend } = await import("resend");
              const resend = new Resend(process.env.RESEND_API_KEY);
              await resend.emails.send({
                from: "KLO Advisory <notifications@keithlodom.ai>",
                to: customerEmail,
                subject: "Action Required: Payment Failed",
                html: `<p>Hi there,</p><p>We were unable to process your subscription payment after multiple attempts. Please update your payment method to continue accessing your KLO subscription.</p><p>— The KLO Team</p>`,
              });
            } catch (emailErr) {
              logError(emailErr, { endpoint: '/api/stripe/webhook', context: 'payment_failure_email' });
            }
          }
        }

        break;
      }

      default: {
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logError(error, { endpoint: '/api/stripe/webhook' });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
