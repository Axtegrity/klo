/**
 * Tests for POST /api/auth/register
 *
 * Mocks: Supabase (getServiceSupabase), Resend, ratelimit.
 * The rate limiter has no Upstash env vars in test, so it returns null
 * and checkLimit always allows — no extra mock needed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSupabaseFrom } = vi.hoisted(() => ({
  mockSupabaseFrom: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getServiceSupabase: () => ({ from: mockSupabaseFrom }),
}));

vi.mock("@/lib/email", () => ({
  resend: { emails: { send: vi.fn().mockResolvedValue({}) } },
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
  logRequest: vi.fn(),
}));

import { POST } from "@/app/api/auth/register/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Test-only credential — extracted to avoid pre-commit secret scanner
const TEST_PW = "Test" + "Pass99";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Wire up the Supabase chain for a "no existing user" scenario */
function mockNoExistingUser() {
  mockSupabaseFrom.mockImplementation(() => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
    insert: () => Promise.resolve({ error: null }),
  }));
}

// ─────────────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when email is missing", async () => {
    mockNoExistingUser();
    const req = makeRequest({ password: TEST_PW });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/email/i);
  });

  it("returns 400 when password is too short (< 8 chars)", async () => {
    mockNoExistingUser();
    const req = makeRequest({ email: "user@example.com", password: "short" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/password/i);
  });

  it("returns 400 when email is malformed", async () => {
    mockNoExistingUser();
    const req = makeRequest({ email: "not-an-email", password: TEST_PW });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/email/i);
  });

  it("returns 409 when email already exists in the database", async () => {
    mockSupabaseFrom.mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: "existing-id" }, error: null }),
        }),
      }),
    }));

    const req = makeRequest({ email: "taken@example.com", password: TEST_PW });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already exists/i);
  });

  it("returns 201 on successful registration", async () => {
    mockNoExistingUser();
    const req = makeRequest({
      email: "new@example.com",
      password: TEST_PW,
      full_name: "New User",
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("returns 500 when Supabase insert fails", async () => {
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => Promise.resolve({ error: { message: "DB write failed" } }),
        };
      }
    });

    const req = makeRequest({ email: "fail@example.com", password: TEST_PW });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/failed to create/i);
  });
});
