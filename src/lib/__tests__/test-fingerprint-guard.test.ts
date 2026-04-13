import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  hasReservedTestPrefix,
  shouldRejectTestIdentifier,
  __RESERVED_PREFIXES_FOR_TESTS,
} from "../test-fingerprint-guard";

describe("test-fingerprint-guard", () => {
  const origEnv = process.env.VERCEL_ENV;
  beforeEach(() => {
    process.env.VERCEL_ENV = "production";
  });
  afterEach(() => {
    process.env.VERCEL_ENV = origEnv;
  });

  describe("hasReservedTestPrefix", () => {
    it.each(__RESERVED_PREFIXES_FOR_TESTS.map((p) => [p] as const))(
      "matches reserved prefix %s",
      (prefix) => {
        expect(hasReservedTestPrefix(`${prefix}abc123`)).toBe(true);
      }
    );

    it("is case-insensitive", () => {
      expect(hasReservedTestPrefix("TEST-abc")).toBe(true);
      expect(hasReservedTestPrefix("Maven-xyz")).toBe(true);
    });

    it("ignores non-prefix matches", () => {
      // Real UUIDs never start with letters from a-f that spell these words
      expect(hasReservedTestPrefix("a1b2c3d4-e5f6-7890-abcd-ef1234567890")).toBe(false);
      // 'contest-winner' contains 'test' but not as prefix
      expect(hasReservedTestPrefix("contest-winner")).toBe(false);
    });

    it("handles null and empty", () => {
      expect(hasReservedTestPrefix(null)).toBe(false);
      expect(hasReservedTestPrefix(undefined)).toBe(false);
      expect(hasReservedTestPrefix("")).toBe(false);
    });
  });

  describe("shouldRejectTestIdentifier in production", () => {
    it("rejects reserved prefixes", () => {
      expect(shouldRejectTestIdentifier("test-audit-fp-quill-001")).toBe(true);
      expect(shouldRejectTestIdentifier("maven-probe-123")).toBe(true);
      expect(shouldRejectTestIdentifier("quill-x")).toBe(true);
      expect(shouldRejectTestIdentifier("audit-123")).toBe(true);
    });

    it("accepts real client-generated UUIDs", () => {
      expect(shouldRejectTestIdentifier("5f2198b1-19cb-4f71-90e5-abc123def456")).toBe(false);
      expect(shouldRejectTestIdentifier("a6fdd140-1b7f-45f1-a800-000000000000")).toBe(false);
    });
  });

  describe("shouldRejectTestIdentifier outside production", () => {
    it("always allows in preview so integration tests can run", () => {
      process.env.VERCEL_ENV = "preview";
      expect(shouldRejectTestIdentifier("test-audit-fp-quill-001")).toBe(false);
    });

    it("always allows when VERCEL_ENV is unset (local dev)", () => {
      delete process.env.VERCEL_ENV;
      expect(shouldRejectTestIdentifier("test-audit-fp-quill-001")).toBe(false);
    });
  });
});
