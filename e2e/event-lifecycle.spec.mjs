// @ts-check
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test("KLO event lifecycle end-to-end", async ({ page }) => {
  let eventId = null;
  let sessionId = null;
  let pollId = null;
  const results = [];

  const pass = (label) => {
    results.push(`PASS  ${label}`);
    console.log(`✓ PASS  ${label}`);
  };

  const fail = (label, detail) => {
    results.push(`FAIL  ${label} — ${detail}`);
    console.log(`✗ FAIL  ${label} — ${detail}`);
  };

  const apiFetch = (path, options = {}) =>
    page.evaluate(
      async ({ base, path, options }) => {
        const r = await fetch(`${base}${path}`, {
          ...options,
          headers: { "Content-Type": "application/json", ...options.headers },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });
        const text = await r.text();
        try {
          return { status: r.status, data: JSON.parse(text) };
        } catch {
          return { status: r.status, data: text };
        }
      },
      { base: BASE, path, options }
    );

  try {
    // STEP 1 — Sign in via UI
    await test.step("STEP 1: Sign in", async () => {
      await page.goto(`${BASE}/auth/signin`);
      await page.waitForSelector("#email", { timeout: 10000 });
      await page.fill("#email", "qa-admin@keithlodom.io");
      await page.fill("#password", "KloQA2026!Secure");
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
        await page.screenshot({ path: "/tmp/after-signin.png" });
      const sessionRes = await page.evaluate(async (base) => {
        const r = await fetch(`${base}/api/auth/session`);
        return r.json();
      }, BASE);
      if (!sessionRes?.user?.email) {
        fail("STEP 1: Sign in", `no session — ${JSON.stringify(sessionRes)}`);
        throw new Error("auth failed");
      }
      pass(`STEP 1: Sign in — ${sessionRes.user.email}`);
    });

    // STEP 2 — Create event
    await test.step("STEP 2: Create event", async () => {
      const { status, data } = await apiFetch("/api/admin/events", {
        method: "POST",
        body: {
          title: "Maven Test Event",
          conference_name: "Maven Test Event",
          event_date: "2026-06-18",
          start_date: "2026-06-18",
          conference_location: "Test Location",
        },
      });
      if (!data?.id) {
        fail("STEP 2: Create event", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("no event id");
      }
      eventId = data.id;
      pass(`STEP 2: Create event — id=${eventId}`);
    });

    // STEP 3 — Create session
    await test.step("STEP 3: Create session", async () => {
      const { status, data } = await apiFetch("/api/conference/sessions", {
        method: "POST",
        body: { title: "Maven Test Session", event_id: eventId, qa_enabled: true },
      });
      if (!data?.id) {
        fail("STEP 3: Create session", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("no session id");
      }
      sessionId = data.id;
      pass(`STEP 3: Create session — id=${sessionId}`);
    });

    // STEP 4 — Create poll
    await test.step("STEP 4: Create poll", async () => {
      const { status, data } = await apiFetch("/api/conference/polls", {
        method: "POST",
        body: {
          question: "Can God use AI?",
          options: ["Yes", "No", "Not sure"],
          event_id: eventId,
          session_id: sessionId,
        },
      });
      if (!data?.id) {
        fail("STEP 4: Create poll", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("no poll id");
      }
      pollId = data.id;
      pass(`STEP 4: Create poll — id=${pollId}`);
    });

    // STEP 5 — Activate session
    await test.step("STEP 5: Activate session", async () => {
      const { status, data } = await apiFetch(
        `/api/conference/sessions/${sessionId}`,
        { method: "PUT", body: { is_active: true } }
      );
      if (data?.is_active !== true) {
        fail("STEP 5: Activate session", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("session not active");
      }
      pass("STEP 5: Activate session");
    });

    // STEP 6 — Turn on seminar mode
    await test.step("STEP 6: Turn on seminar mode", async () => {
      const { status, data } = await apiFetch(
        `/api/admin/events/${eventId}`,
        { method: "PUT", body: { seminar_mode: true } }
      );
      if (data?.seminar_mode !== true) {
        fail("STEP 6: Turn on seminar mode", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("seminar mode not on");
      }
      pass("STEP 6: Turn on seminar mode");
    });

    // STEP 7 — Deploy poll
    await test.step("STEP 7: Deploy poll", async () => {
      const { status, data } = await apiFetch(
        `/api/conference/polls/${pollId}/deploy`,
        { method: "POST" }
      );
      if (data?.is_deployed !== true) {
        fail("STEP 7: Deploy poll", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("poll not deployed");
      }
      pass("STEP 7: Deploy poll");
    });

    // STEP 8 — Cast a vote
    await test.step("STEP 8: Cast a vote", async () => {
      const { status, data } = await apiFetch(
        `/api/conference/polls/${pollId}/vote`,
        {
          method: "POST",
          body: { option_index: 0, voter_id: "maven-test-voter-001" },
        }
      );
      if (status !== 200 && status !== 201) {
        fail("STEP 8: Cast a vote", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("vote failed");
      }
      pass(`STEP 8: Cast a vote — ${JSON.stringify(data)}`);
    });

    // STEP 9 — Close poll with show_results
    await test.step("STEP 9: Close poll with show_results", async () => {
      const { status, data } = await apiFetch(
        `/api/conference/polls/${pollId}`,
        { method: "PUT", body: { is_active: false, show_results: true } }
      );
      if (data?.show_results !== true) {
        fail("STEP 9: Close poll", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("poll not closed with results");
      }
      pass("STEP 9: Close poll with show_results");
    });

    // STEP 10 — End session
    await test.step("STEP 10: End session", async () => {
      const { status, data } = await apiFetch(
        `/api/conference/sessions/${sessionId}/end`,
        { method: "POST" }
      );
      if (status !== 200 && status !== 201) {
        fail("STEP 10: End session", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("session end failed");
      }
      pass(`STEP 10: End session — ${JSON.stringify(data)}`);
    });

    // STEP 11 — Turn off seminar mode
    await test.step("STEP 11: Turn off seminar mode", async () => {
      const { status, data } = await apiFetch(
        `/api/admin/events/${eventId}`,
        { method: "PUT", body: { seminar_mode: false } }
      );
      if (data?.seminar_mode !== false) {
        fail("STEP 11: Turn off seminar mode", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("seminar mode not off");
      }
      pass("STEP 11: Turn off seminar mode");
    });

    // STEP 12 — Delete test event
    await test.step("STEP 12: Delete test event", async () => {
      const { status, data } = await apiFetch(
        `/api/admin/events/${eventId}`,
        { method: "DELETE" }
      );
      if (status !== 200 && status !== 204) {
        fail("STEP 12: Delete test event", `status ${status} — ${JSON.stringify(data)}`);
        throw new Error("delete failed");
      }
      eventId = null;
      pass("STEP 12: Delete test event");
    });
  } finally {
    // Cleanup — delete event if any step left it behind
    if (eventId) {
      console.log(`\nCLEANUP: deleting event ${eventId}`);
      await apiFetch(`/api/admin/events/${eventId}`, { method: "DELETE" }).catch(
        () => {}
      );
    }

    console.log("\n=== LIFECYCLE TEST RESULTS ===");
    for (const r of results) {
      console.log(r);
    }

    const failed = results.filter((r) => r.startsWith("FAIL"));
    if (failed.length > 0) {
      throw new Error(`${failed.length} step(s) failed:\n${failed.join("\n")}`);
    }
  }
});
