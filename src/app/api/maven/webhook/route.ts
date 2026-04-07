import { NextRequest, NextResponse } from "next/server";
import { mavenWebhookLimiter, checkLimit, getClientIp } from "@/lib/ratelimit";
import { mavenWebhookSchema } from "@/lib/validation";
import { logError, logRequest } from "@/lib/logger";

/* ------------------------------------------------------------------ */
/*  Maven Webhook — Submit tasks to Maven agent_tasks table            */
/* ------------------------------------------------------------------ */
/*  Env vars required (Maven Supabase, NOT the KLO project):           */
/*    MAVEN_SUPABASE_URL  — Maven Supabase project URL                 */
/*    MAVEN_SUPABASE_KEY  — Maven Supabase service role key             */
/* ------------------------------------------------------------------ */

const VALID_TYPES = ["bug_report", "feature_request", "feedback", "change_request"] as const;
type TaskType = (typeof VALID_TYPES)[number];

const VALID_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

const TASK_TYPE_MAP: Record<TaskType, string> = {
  bug_report: "code_review",
  feature_request: "custom",
  feedback: "summarize",
  change_request: "custom",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/* ------------------------------------------------------------------ */
/*  OPTIONS (CORS preflight)                                           */
/* ------------------------------------------------------------------ */

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                        */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  logRequest(req);
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const { allowed } = await checkLimit(mavenWebhookLimiter, ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 10 requests per minute." },
        { status: 429, headers: CORS_HEADERS },
      );
    }

    // Check Maven config
    const supabaseUrl = process.env.MAVEN_SUPABASE_URL;
    const supabaseKey = process.env.MAVEN_SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Maven integration not configured" },
        { status: 500, headers: CORS_HEADERS },
      );
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const parsed = mavenWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Missing or invalid fields: type, title, description" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { type, title, description, priority, email, project } = parsed.data;

    const resolvedPriority: Priority =
      priority && VALID_PRIORITIES.includes(priority as Priority)
        ? (priority as Priority)
        : type === "bug_report"
          ? "high"
          : "normal";

    const taskType = TASK_TYPE_MAP[type as TaskType];

    // Submit task to Maven agent_tasks table
    const taskPayload = {
      task_type: taskType,
      input: JSON.stringify({
        source: "client_webhook",
        original_type: type,
        title,
        description,
        email: email ?? null,
        project: project ?? "klo-app",
        submitted_at: new Date().toISOString(),
      }),
      status: "pending",
      priority: resolvedPriority,
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/agent_tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(taskPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      logError(new Error(errText), { endpoint: '/api/maven/webhook', context: 'supabase_insert' });
      return NextResponse.json(
        { error: "Failed to submit task" },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    const [created] = await res.json();

    return NextResponse.json(
      { success: true, taskId: created.id },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    logError(error, { endpoint: '/api/maven/webhook' });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
