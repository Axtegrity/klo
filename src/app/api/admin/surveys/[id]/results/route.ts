import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

// PostgREST defaults to a 1000-row cap on unpaginated responses. Aggregate
// queries in this route must paginate so analytics reflect the full dataset.
const PAGE_SIZE = 1000;

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

// Get survey results with optional cross-filtering
// Query params:
//   filter_question_id=<uuid>&filter_value=<value>
//   → returns results filtered to respondents who answered <value> on that question
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const filterQuestionId = searchParams.get("filter_question_id");
  const filterValue = searchParams.get("filter_value");

  const supabase = getServiceSupabase();

  // Get all questions for this survey
  const { data: questions } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("survey_id", id)
    .order("sort_order");

  // Get sections
  const { data: sections } = await supabase
    .from("survey_sections")
    .select("*")
    .eq("survey_id", id)
    .order("sort_order");

  // Get respondent IDs — optionally filtered
  let respondentIds: string[] | null = null;

  if (filterQuestionId && filterValue) {
    // Find respondents who gave this answer
    const filtered: { respondent_id: string }[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("survey_answers")
        .select("respondent_id")
        .eq("question_id", filterQuestionId)
        .eq("answer_value", filterValue)
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) {
        console.error("[GET /api/admin/surveys/[id]/results] filter query", error);
        return NextResponse.json({ error: "Failed to load results" }, { status: 500 });
      }
      const chunk = data ?? [];
      filtered.push(...chunk);
      if (chunk.length < PAGE_SIZE) break;
    }

    respondentIds = filtered.map((r) => r.respondent_id);

    if (respondentIds.length === 0) {
      // No matches — return empty aggregates
      const emptyAgg = (questions ?? []).map((q) => ({
        question_id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        section_id: q.section_id,
        options: q.options,
        counts: {},
        open_responses: [],
        total: 0,
      }));
      return NextResponse.json({
        sections: sections ?? [],
        questions: emptyAgg,
        total_respondents: 0,
        filtered: true,
      });
    }
  }

  // Get total respondent count
  let totalQuery = supabase
    .from("survey_respondents")
    .select("id", { count: "exact" })
    .eq("survey_id", id)
    .not("completed_at", "is", null);

  if (respondentIds) {
    totalQuery = totalQuery.in("id", respondentIds);
  }
  const { count: totalRespondents } = await totalQuery;

  // Get all answers, optionally filtered by respondent IDs. Paginate — a survey
  // with N respondents × ~30 questions hits the 1000-row cap at ~33 respondents.
  type AnswerRow = {
    question_id: string;
    answer_value: string | null;
    answer_values: string[] | null;
    respondent_id: string;
  };
  const answers: AnswerRow[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let page = supabase
      .from("survey_answers")
      .select("question_id, answer_value, answer_values, respondent_id")
      .eq("survey_id", id);
    if (respondentIds) page = page.in("respondent_id", respondentIds);
    const { data, error } = await page.range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error("[GET /api/admin/surveys/[id]/results] answers query", error);
      return NextResponse.json({ error: "Failed to load results" }, { status: 500 });
    }
    const chunk = (data ?? []) as AnswerRow[];
    answers.push(...chunk);
    if (chunk.length < PAGE_SIZE) break;
  }

  // Aggregate per question
  const aggregated = (questions ?? []).map((q) => {
    const qAnswers = answers.filter((a) => a.question_id === q.id);
    const counts: Record<string, number> = {};
    const openResponses: string[] = [];

    for (const a of qAnswers) {
      if (q.question_type === "open") {
        if (a.answer_value) openResponses.push(a.answer_value);
      } else if (q.question_type === "multi") {
        const vals = a.answer_values ?? [];
        for (const v of vals) {
          counts[v] = (counts[v] || 0) + 1;
        }
      } else {
        if (a.answer_value) {
          counts[a.answer_value] = (counts[a.answer_value] || 0) + 1;
        }
      }
    }

    return {
      question_id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      section_id: q.section_id,
      options: q.options,
      counts,
      open_responses: openResponses,
      total: qAnswers.length,
    };
  });

  return NextResponse.json({
    sections: sections ?? [],
    questions: aggregated,
    total_respondents: totalRespondents ?? 0,
    filtered: !!filterQuestionId,
  });
}
