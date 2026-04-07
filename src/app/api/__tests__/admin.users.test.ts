/**
 * Tests for GET /api/admin/users
 *
 * Same role-gate as /admin/stats: owner + admin only.
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

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

import { GET } from "@/app/api/admin/users/route";

function makeRequest(search = ""): Request {
  const url = search
    ? `http://localhost:3000/api/admin/users?search=${search}`
    : "http://localhost:3000/api/admin/users";
  return new Request(url);
}

function mockUsersDb(users: unknown[] = []) {
  // Simulate the Supabase chaining: .select().or().eq().order().range()
  const chain = {
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: users, count: users.length, error: null }),
  };
  mockFrom.mockReturnValue(chain);
}

describe("GET /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it("returns 401 when role is 'free'", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "u1", role: "free" },
    });
    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(401);
  });

  it("returns 200 with paginated user list for admin role", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    mockUsersDb([
      { id: "u1", full_name: "Alice", subscription_tier: "free" },
      { id: "u2", full_name: "Bob", subscription_tier: "pro" },
    ]);

    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("users");
    expect(json).toHaveProperty("total");
    expect(json).toHaveProperty("page");
    expect(json).toHaveProperty("totalPages");
    expect(json.users).toHaveLength(2);
  });

  it("defaults page=1 and limit=20 when no query params are provided", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "owner-1", role: "owner" },
    });
    mockUsersDb([]);

    const res = await GET(makeRequest() as never);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.page).toBe(1);
    expect(json.limit).toBe(20);
  });
});
