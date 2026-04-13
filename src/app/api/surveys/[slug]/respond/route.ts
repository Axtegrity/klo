import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { z } from "zod";
import { checkLimit, surveyLimiter, getClientIp } from "@/lib/ratelimit";
import { shouldRejectTestIdentifier } from "@/lib/test-fingerprint-guard";

const respondSchema = z.object({
  fingerprint: z.string().min(8).max(128),
  answers: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        answer_value: z.string().max(5000).optional(),
        answer_values: z.array(z.string().max(500)).max(20).optional(),
      })
    )
    .min(1, "At least one answer is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = getServiceSupabase();

  // Rate limit: 5 submissions per IP per hour
  const ip = getClientIp(request);
  const { allowed } = await checkLimit(surveyLimiter, ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  // Validate body
  const body = await request.json().catch(() => null);
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { fingerprint, answers } = parsed.data;

  // Reject reserved test-identifier prefixes in prod so automated probes
  // (Maven audit agents, stray curl) cannot pollute survey analytics.
  if (shouldRejectTestIdentifier(fingerprint)) {
    return NextResponse.json(
      { error: "Invalid fingerprint" },
      { status: 400 }
    );
  }

  // Look up survey and its required questions
  const { data: survey } = await supabase
    .from("surveys")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!survey) {
    return NextResponse.json({ error: "Survey not found or closed" }, { status: 404 });
  }

  // Validate required questions are answered
  const { data: requiredQuestions } = await supabase
    .from("survey_questions")
    .select("id")
    .eq("survey_id", survey.id)
    .eq("required", true);

  if (requiredQuestions && requiredQuestions.length > 0) {
    const answeredIds = new Set(answers.map((a) => a.question_id));
    const missing = requiredQuestions.filter((q) => !answeredIds.has(q.id));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing ${missing.length} required answer(s)` },
        { status: 400 }
      );
    }
  }

  // Validate answer values match question options
  const { data: allQuestions } = await supabase
    .from("survey_questions")
    .select("id, question_type, options")
    .eq("survey_id", survey.id);

  if (allQuestions) {
    const questionMap = new Map(allQuestions.map((q) => [q.id, q]));
    for (const a of answers) {
      const q = questionMap.get(a.question_id);
      if (!q) continue;
      const opts = (q.options as string[]) ?? [];
      if (q.question_type === "single" && a.answer_value && opts.length > 0) {
        if (!opts.includes(a.answer_value)) {
          return NextResponse.json(
            { error: "Invalid answer option" },
            { status: 400 }
          );
        }
      }
      if (q.question_type === "multi" && a.answer_values && opts.length > 0) {
        for (const v of a.answer_values) {
          if (!opts.includes(v)) {
            return NextResponse.json(
              { error: "Invalid answer option" },
              { status: 400 }
            );
          }
        }
      }
    }
  }

  // Check for duplicate submission
  const { data: existing } = await supabase
    .from("survey_respondents")
    .select("id")
    .eq("survey_id", survey.id)
    .eq("fingerprint", fingerprint)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You have already completed this survey" },
      { status: 409 }
    );
  }

  // Create respondent WITHOUT completed_at — only set after answers succeed
  const { data: respondent, error: respErr } = await supabase
    .from("survey_respondents")
    .insert({
      survey_id: survey.id,
      fingerprint,
    })
    .select("id")
    .single();

  if (respErr || !respondent) {
    return NextResponse.json(
      { error: "Failed to record response" },
      { status: 500 }
    );
  }

  // Insert all answers
  const rows = answers.map((a) => ({
    survey_id: survey.id,
    respondent_id: respondent.id,
    question_id: a.question_id,
    answer_value: a.answer_value ?? null,
    answer_values: a.answer_values ?? [],
  }));

  const { error: ansErr } = await supabase.from("survey_answers").insert(rows);

  if (ansErr) {
    console.error("[POST /api/surveys/respond]", ansErr);
    // Clean up the respondent record so they can retry
    await supabase.from("survey_respondents").delete().eq("id", respondent.id);
    return NextResponse.json(
      { error: "Failed to save answers. Please try again." },
      { status: 500 }
    );
  }

  // Mark as completed only after answers are saved
  await supabase
    .from("survey_respondents")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", respondent.id);

  return NextResponse.json({ success: true }, { status: 201 });
}
