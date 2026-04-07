/**
 * Tests for POST /api/stripe/checkout
 *
 * The route has three paths:
 *  1. No session        → 401
 *  2. Invalid body      → 400
 *  3. Demo/test Stripe key → 200 with mock URL (covers most CI scenarios)
 *  4. Production Stripe key → creates real session (tested with stripe mock)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockStripeCreate } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockStripeCreate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: mockStripeCreate,
      },
    },
  },
}));

import { POST } from "@/app/api/stripe/checkout/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = { priceId: "price_abc123", tier: "pro" };

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: test Stripe key → demo mode
    process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentication/i);
  });

  it("returns 400 when priceId is missing", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    const res = await POST(makeRequest({ tier: "pro" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/priceId/i);
  });

  it("returns 400 when tier is an invalid value", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    const res = await POST(makeRequest({ priceId: "price_abc", tier: "platinum" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is completely empty", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 200 with a mock URL when STRIPE_SECRET_KEY is a test key", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("url");
    expect(json.url).toContain("tier=pro");
  });

  it("returns 200 with a mock URL for the 'executive' tier", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    const res = await POST(makeRequest({ priceId: "price_exec", tier: "executive" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toContain("tier=executive");
  });

  it("calls stripe.checkout.sessions.create when using a live key", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_realkey";
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });

    mockStripeCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test_abc",
    });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toBe("https://checkout.stripe.com/pay/cs_test_abc");
    expect(mockStripeCreate).toHaveBeenCalledOnce();
  });
});
