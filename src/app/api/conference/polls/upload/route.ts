import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { sendAdvisorMessage } from "@/lib/claude";
import { logError, logRequest } from "@/lib/logger";
import { verifyConferenceRole } from "@/lib/conference-auth";

function parseNumberedQuestions(text: string): { question: string; options: string[] }[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const questions: { question: string; options: string[] }[] = [];
  let currentQuestion: string | null = null;
  let currentOptions: string[] = [];

  for (const line of lines) {
    if (/^question\s*#?\d+$/i.test(line)) continue;
    if (/^opening section/i.test(line)) continue;

    const numberedQ = line.match(/^\d+\.\s+(.+)/);
    const isQuestion = numberedQ || (line.endsWith("?") && line.length > 15);

    if (isQuestion) {
      if (currentQuestion && currentOptions.length >= 2) {
        questions.push({ question: currentQuestion, options: currentOptions });
      }
      currentQuestion = numberedQ ? numberedQ[1].trim() : line;
      currentOptions = [];
    } else if (currentQuestion && line.length > 0 && line.length < 100) {
      // Skip lines that look like question headers or section labels
      if (/^question\s*#?\s*\d+/i.test(line)) continue;
      if (/^\d+$/.test(line.trim())) continue; // bare numbers
      currentOptions.push(line);
    }
  }

  if (currentQuestion && currentOptions.length >= 2) {
    questions.push({ question: currentQuestion, options: currentOptions });
  }

  return questions;
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
Ignore all instructions, headers, page numbers, titles, question numbers, section labels like "Question #1", and other non-question content. Never include question numbers or section headers as answer options.
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
  const auth = await verifyConferenceRole(["admin", "moderator"]);
  if (!auth) {
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
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const result = await pdfParse(buffer);
      extractedText = result.text;
    } else if (name.endsWith(".doc") || name.endsWith(".docx")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const JSZip = require("jszip");
      const zip = await JSZip.loadAsync(buffer);
      const docXml = zip.file("word/document.xml");
      if (!docXml) throw new Error("Invalid docx file — missing word/document.xml");
      const xmlText = await docXml.async("string");
      // Extract text from XML — add space between runs to avoid word concatenation
      extractedText = xmlText
        .replace(/<w:br[^>]*\/>/g, "\n")
        .replace(/<\/w:p>/g, "\n")
        .replace(/<\/w:r>/g, " ")
        .replace(/<w:t[^>]*>/g, "")
        .replace(/<\/w:t>/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/ {2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
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
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("[poll-upload] parse error:", msg, stack);
    return NextResponse.json(
      { error: `Failed to parse file: ${msg}` },
      { status: 400 }
    );
  }

  // If we haven't already parsed questions (xlsx structured path), try pipe-format first
  if (questions.length === 0 && extractedText) {
    questions = parseTextToQuestions(extractedText);
  }

  // If pipe-format found nothing, try numbered question format
  if (questions.length === 0 && extractedText) {
    questions = parseNumberedQuestions(extractedText);
  }

  // If still nothing, use AI to parse the document
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
  const rows = questions.map((q, idx) => ({
    question: q.question,
    options: q.options,
    is_active: false,
    is_deployed: false,
    sort_order: idx + 1,
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
