import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProvisionRequest = {
  runId?: string;
  businessGoal?: string;
  selectedOpportunity?: string;
  plan?: string;
};

const DEFAULT_PLAN = "ContribScout OSS Growth Workspace";
const AMOUNT_CENTS = 500;

export async function POST(request: Request) {
  let body: ProvisionRequest;

  try {
    body = (await request.json()) as ProvisionRequest;
  } catch {
    return NextResponse.json(
      { configured: false, status: "invalid_request", message: "Request body must be valid JSON." },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      {
        configured: false,
        status: "not_configured",
        message:
          "Stripe is not configured. Add STRIPE_SECRET_KEY with a Stripe test-mode secret key to create Checkout Sessions.",
      },
      { headers: noStoreHeaders() },
    );
  }

  if (!secretKey.startsWith("sk_test_")) {
    return NextResponse.json(
      {
        configured: false,
        status: "test_key_required",
        message:
          "Stripe provisioning requires a test-mode secret key that starts with sk_test_. No checkout session was created.",
      },
      { status: 400, headers: noStoreHeaders() },
    );
  }

  try {
    const stripe = new Stripe(secretKey);
    const origin = getOrigin(request);
    const plan = body.plan?.trim() || DEFAULT_PLAN;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: AMOUNT_CENTS,
            product_data: {
              name: plan,
              description: buildDescription(body),
            },
          },
        },
      ],
      metadata: {
        runId: body.runId?.slice(0, 200) ?? "",
        businessGoal: body.businessGoal?.slice(0, 400) ?? "",
        selectedOpportunity: body.selectedOpportunity?.slice(0, 200) ?? "",
        plan,
      },
      success_url: `${origin}/?stripe_status=success&session_id={CHECKOUT_SESSION_ID}#agent-demo`,
      cancel_url: `${origin}/?stripe_status=cancelled#agent-demo`,
    });

    return NextResponse.json(
      {
        configured: true,
        status: "checkout_created",
        message: "Stripe test-mode Checkout Session created.",
        checkoutUrl: session.url,
        sessionId: session.id,
        livemode: session.livemode,
      },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        configured: true,
        status: "stripe_error",
        message: error instanceof Error ? error.message : "Stripe Checkout Session creation failed.",
      },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

function buildDescription(body: ProvisionRequest) {
  const selected = body.selectedOpportunity?.trim();
  const goal = body.businessGoal?.trim();

  if (selected && goal) {
    return `Agent run for ${selected}: ${goal}`.slice(0, 500);
  }

  if (selected) {
    return `Agent run for ${selected}`;
  }

  return "Test-mode provisioning for a ContribScout OSS growth workflow.";
}

function getOrigin(request: Request) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return requestUrl.origin;
}

function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}
