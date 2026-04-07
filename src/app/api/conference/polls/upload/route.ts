import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { sendAdvisorMessage } from "@/lib/claude";
import { logError, logRequest } from "@/lib/logger";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

function parseTextToQuestions(text: string): { question: string; options: string[] }[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim()).filter(Boolean);
      if (parts.length < 3) return null; // need question + at least 2 options
      return { question: parts[0], options: parts.slice(1) };
    })
    .filter(Boolean) as { question: string; options: string[] }[];
}

async function parseWithAI(text: string): Promise<{ question: string; options: string[] }[]> {
  const prompt = `You are parsing a poll/survey document. Extract only the questions and their answer choices.
Ignore all instructions, headers, page numbers, titles, and other non-question content.
Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "question": "The question text here",
      "type": "multiple_choice" | "open_ended" | "yes_no",
      "options": ["Option A", "Option B", "Option C"]
    }
  ]
}

Document text:
${text}`;

  const response = await sendAdvisorMessage(
    [{ role: "user", content: prompt }],
    "You extract poll questions from documents. Return ONLY valid JSON, no markdown fences."
  );

  // Extract JSON from response (handle possible markdown fences)
  let jsonStr = response.content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr);
  if (!parsed?.questions || !Array.isArray(parsed.questions)) {
    return [];
  }

  // Only keep multiple_choice and yes_no (polls need options)
  return parsed.questions
    .filter(
      (q: { type?: string; options?: string[] }) =>
        q.type !== "open_ended" &&
        Array.isArray(q.options) &&
        q.options.length >= 2
    )
    .map((q: { question: string; options: string[] }) => ({
      question: q.question,
      options: q.options,
    }));
}

export async function POST(request: NextRequest) {
  logRequest(request);
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const eventId = formData.get("event_id") as string | null;
  const sessionId = formData.get("session_id") as string | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // File size limit: 50MB
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 50MB." },
      { status: 400 }
    );
  }

  // Sanitize filename: strip path traversal, keep only safe chars
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
  const name = sanitized.toLowerCase();
  let extractedText = "";
  let questions: { question: string; options: string[] }[] = [];

  try {
    if (name.endsWith(".txt")) {
      extractedText = await file.text();
    } else if (name.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const buffer = Buffer.from(await file.arrayBuffer());
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      extractedText = result.text;
    } else if (name.endsWith(".doc") || name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
      const ExcelJS = (await import("exceljs")).default;
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const sheet = workbook.worksheets[0];
      const rows: (string | number)[][] = [];
      sheet.eachRow((row) => {
        if (!Array.isArray(row.values)) return;
        // row.values is 1-indexed in exceljs — index 0 is always null, slice it off
        const cells = (row.values as unknown[]).slice(1).map((c) =>
          typeof c === "number" || typeof c === "string" ? c : String(c ?? "")
        );
        rows.push(cells);
      });
      // Try structured rows first (each row = question + options)
      questions = rows
        .filter((row) => row.length >= 3 && row[0])
        .map((row) => ({
          question: String(row[0]).trim(),
          options: row.slice(1).map((c) => String(c).trim()).filter(Boolean),
        }));
      if (questions.length === 0) {
        extractedText = rows.map((r) => r.join(" | ")).join("\n");
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use .txt, .pdf, .doc, .docx, .xls, or .xlsx" },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 }
    );
  }

  // If we haven't already parsed questions (xlsx structured path), try pipe-format first
  if (questions.length === 0 && extractedText) {
    questions = parseTextToQuestions(extractedText);
  }

  // If pipe-format found nothing, use AI to parse the document
  if (questions.length === 0 && extractedText) {
    try {
      questions = await parseWithAI(extractedText);
    } catch (aiErr) {
      logError(aiErr, { endpoint: '/api/conference/polls/upload', context: 'ai_parse' });
      return NextResponse.json(
        { error: "Could not extract poll questions from this file. Try using the format: Question | Option1 | Option2 | ..." },
        { status: 400 }
      );
    }
  }

  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No poll questions found in file. Upload a survey document or use the format: Question | Option1 | Option2 | ..." },
      { status: 400 }
    );
  }

  if (questions.length > 20) {
    questions = questions.slice(0, 20);
  }

  const supabase = getServiceSupabase();
  const rows = questions.map((q) => ({
    question: q.question,
    options: q.options,
    is_active: false,
    is_deployed: false,
    ...(eventId ? { event_id: eventId } : {}),
    ...(sessionId ? { session_id: sessionId } : {}),
  }));

  const { data, error } = await supabase
    .from("conference_polls")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
