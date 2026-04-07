/**
 * Tests for POST /api/assessments and GET /api/assessments
 *
 * POST saves an assessment result.
 * GET returns all results for the authenticated user.
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

vi.mock("@/lib/email", () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
}));

vi.mock("@/lib/push-server", () => ({
  sendPushToUser: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

import { POST, GET } from "@/app/api/assessments/route";

function makePostRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/assessments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(): Request {
  return new Request("http://localhost:3000/api/assessments");
}

const validPayload = {
  assessment_type: "leadership-style",
  score: 85,
  answers: { q1: "a", q2: "b" },
  recommendations: ["Develop delegation skills"],
};

const savedRecord = { id: "result-1", user_id: "user-1", ...validPayload };

describe("POST /api/assessments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await POST(makePostRequest(validPayload));
    expect(res.status).toBe(401);
  });

  it("returns 400 when assessment_type is missing", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    const res = await POST(makePostRequest({ score: 80, answers: {} }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/missing/i);
  });

  it("returns 400 when score is missing", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    const res = await POST(
      makePostRequest({ assessment_type: "leadership-style", answers: {} })
    );
    expect(res.status).toBe(400);
  });

  it("saves the result and returns 200 with the inserted record", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com", name: "Test User" },
    });
    mockFrom.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: savedRecord, error: null }),
        }),
      }),
    });

    const res = await POST(makePostRequest(validPayload));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("result-1");
    expect(json.assessment_type).toBe("leadership-style");
  });

  it("returns 500 when the Supabase insert fails", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    mockFrom.mockReturnValue({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({ data: null, error: { message: "constraint violation" } }),
        }),
      }),
    });

    const res = await POST(makePostRequest(validPayload));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/assessments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it("returns the user's assessment results", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", email: "u@example.com" },
    });
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [savedRecord], error: null }),
        }),
      }),
    });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
    expect(json[0].assessment_type).toBe("leadership-style");
  });
});
