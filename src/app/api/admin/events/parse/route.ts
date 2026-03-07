import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendAdvisorMessage } from "@/lib/claude";

async function verifyAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) return null;
  return session;
}

export async function POST(request: Request) {
  const session = await verifyAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
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

  // Sanitize filename
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
  const name = sanitized.toLowerCase();
  let extractedText = "";

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
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Use .pdf, .doc, .docx, or .txt" },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 }
    );
  }

  if (!extractedText.trim()) {
    return NextResponse.json(
      { error: "No text content found in the uploaded file." },
      { status: 400 }
    );
  }

  try {
    const prompt = `You are extracting event/conference information from a document. Extract the following fields and return ONLY valid JSON, no markdown fences:
{
  "title": "The event or presentation title",
  "conference_name": "Name of the conference or organization",
  "conference_location": "City, State or full location",
  "event_date": "YYYY-MM-DD format (best guess from context, or empty string if not found)",
  "event_category": "Current Events" or "Previous Events" (use "Previous Events" if the date is in the past),
  "description": "A brief description or summary of the event (2-3 sentences max)"
}

If a field cannot be determined from the document, use an empty string.

Document text:
${extractedText.slice(0, 10000)}`;

    const response = await sendAdvisorMessage(
      [{ role: "user", content: prompt }],
      "You extract event information from documents. Return ONLY valid JSON, no markdown fences."
    );

    let jsonStr = response.content.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    return NextResponse.json({
      title: parsed.title || "",
      conference_name: parsed.conference_name || "",
      conference_location: parsed.conference_location || "",
      event_date: parsed.event_date || "",
      event_category: parsed.event_category === "Previous Events" ? "Previous Events" : "Current Events",
      description: parsed.description || "",
    });
  } catch (aiErr) {
    console.error("AI event parsing failed:", aiErr);
    return NextResponse.json(
      { error: "Could not extract event details from this file. Please fill in the form manually." },
      { status: 400 }
    );
  }
}
