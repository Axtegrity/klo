/**
 * Tests for GET /api/profile and PUT /api/profile
 *
 * GET returns the user's profile fields.
 * PUT validates full_name presence and upserts the record.
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

import { GET, PUT } from "@/app/api/profile/route";

function makeGetRequest(): Request {
  return new Request("http://localhost:3000/api/profile");
}

function makePutRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const authenticatedSession = {
  user: { id: "user-1", email: "user@example.com" },
};

describe("GET /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns the profile data for an authenticated user", async () => {
    mockGetServerSession.mockResolvedValue(authenticatedSession);
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { full_name: "Alice", organization_name: "Acme" },
              error: null,
            }),
        }),
      }),
    });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.full_name).toBe("Alice");
  });

  it("returns an empty object when there is no matching profile row", async () => {
    mockGetServerSession.mockResolvedValue(authenticatedSession);
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({});
  });
});

describe("PUT /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await PUT(makePutRequest({ full_name: "Alice" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when full_name is missing", async () => {
    mockGetServerSession.mockResolvedValue(authenticatedSession);
    const res = await PUT(makePutRequest({ organization: "Acme" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/name/i);
  });

  it("returns 400 when full_name is an empty string", async () => {
    mockGetServerSession.mockResolvedValue(authenticatedSession);
    const res = await PUT(makePutRequest({ full_name: "   " }));
    expect(res.status).toBe(400);
  });

  it("updates an existing profile and returns success", async () => {
    mockGetServerSession.mockResolvedValue(authenticatedSession);
    // Mock: existence check finds the profile; update succeeds
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { id: "user-1" }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    });

    const res = await PUT(makePutRequest({ full_name: "Alice Updated" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
