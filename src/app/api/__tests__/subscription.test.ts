/**
 * Tests for GET /api/subscription
 *
 * Business rules:
 *  - No session → 401
 *  - admin/owner role → always returns { tier: "executive" } without a DB hit
 *  - Regular user with DB profile → returns profile.subscription_tier
 *  - DB error → falls back to { tier: "free" } (graceful degradation)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetServerSession, mockFrom } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: () => ({ from: mockFrom }),
}));

import { GET } from "@/app/api/subscription/route";

describe("GET /api/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentication/i);
  });

  it("returns executive tier for admin role without hitting the database", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", email: "admin@keithlodom.io", role: "admin" },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tier).toBe("executive");
    // Supabase should never be called for admin/owner
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("returns executive tier for owner role without hitting the database", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "owner-1", email: "keith@keithlodom.io", role: "owner" },
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tier).toBe("executive");
  });

  it("returns the profile tier from the database for a regular user", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com", role: "subscriber" },
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({ data: { subscription_tier: "pro" }, error: null }),
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tier).toBe("pro");
  });

  it("falls back to 'free' when the DB throws", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com", role: "subscriber" },
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.reject(new Error("connection refused")),
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tier).toBe("free");
  });

  it("falls back to 'free' when the profile row is null", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com", role: "free" },
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tier).toBe("free");
  });
});
