import { getServiceSupabase } from "@/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Reference-file text extraction — Content Automation Pipeline       */
/*                                                                      */
/*  Downloads a PDF/DOCX previously uploaded to the `documents` Supabase */
/*  Storage bucket (via src/app/api/admin/content-automation/           */
/*  sign-upload/route.ts) and extracts plain text from it, so a text     */
/*  path — not the file body itself — is what ever crosses a Next.js     */
/*  API route (see the "File uploads must never send the file body       */
/*  through a Next.js API route" rule in this repo's CLAUDE.md).         */
/*                                                                        */
/*  Extraction logic mirrors src/app/api/admin/events/parse/route.ts     */
/*  exactly (same pdf-parse / mammoth calls) — both libraries are already */
/*  installed, no new dependency added.                                   */
/* ------------------------------------------------------------------ */

// Matches the slice length used in src/app/api/admin/events/parse/route.ts
// (line 97) for the same reason: an arbitrarily large document must not be
// allowed to blow out a generation prompt's token budget/cost.
const MAX_REFERENCE_TEXT_CHARS = 10000;

/**
 * Downloads a reference file from the `documents` bucket by storage path and
 * extracts plain text from it. Supports .pdf and .docx only — the same two
 * extensions accepted by content-automation/sign-upload/route.ts.
 *
 * Throws on download failure, unsupported extension, or empty extracted
 * text — callers should let this propagate to their own error handling
 * (the generate route below returns it as a 400 before ever starting the
 * lane-generation loop, since a broken reference file should fail fast
 * rather than silently generating without it).
 */
export async function extractReferenceFileText(path: string): Promise<string> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase.storage.from("documents").download(path);

  if (error || !data) {
    throw new Error(`Failed to download reference file: ${error?.message ?? "not found"}`);
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  const lowerPath = path.toLowerCase();

  let extractedText = "";
  if (lowerPath.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    extractedText = result.text;
  } else if (lowerPath.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  } else {
    throw new Error(`Unsupported reference file type for path: ${path}`);
  }

  if (!extractedText.trim()) {
    throw new Error("No text content found in the reference file.");
  }

  return extractedText.slice(0, MAX_REFERENCE_TEXT_CHARS);
}
