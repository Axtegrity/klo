/**
 * Tests for GET /api/admin/stats
 *
 * Key contract: only `owner` and `admin` roles may access this route.
 * Any other role (or no session) must receive 401.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist mock fns so the vi.mock factory can reference them ──────────────────
const { mockGetServerSession, mockFrom } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession: mockGetServerSession }));

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

import { GET } from "@/app/api/admin/stats/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(): Request {
  return new Request("http://localhost:3000/api/admin/stats");
}

/** Supabase returns empty arrays for every table — we only care about auth */
function mockEmptyDb() {
  mockFrom.mockImplementation(() => ({
    select: () => ({
      gte: () => Promise.resolve({ data: [], error: null }),
    }),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────

describe("GET /api/admin/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 401 when the session role is 'subscriber'", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "sub@example.com", role: "subscriber" },
    });
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 when the session role is 'moderator'", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "mod@example.com", role: "moderator" },
    });
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it("returns 200 with stats shape when the role is 'admin'", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", email: "admin@keithlodom.io", role: "admin" },
    });
    mockEmptyDb();

    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("users");
    expect(json).toHaveProperty("subscriptions");
    expect(json).toHaveProperty("advisor");
    expect(json).toHaveProperty("assessments");
    expect(json).toHaveProperty("vault");
  });

  it("returns 200 with stats shape when the role is 'owner'", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "owner-1", email: "keith@keithlodom.io", role: "owner" },
    });
    mockEmptyDb();

    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(200);
  });
});
