import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { pollExportSchema } from "@/lib/validation";

// KLO brand colors
const DARK_BG = rgb(13 / 255, 17 / 255, 23 / 255); // #0D1117
const CARD_BG = rgb(22 / 255, 27 / 255, 34 / 255); // #161B22
const GOLD = rgb(218 / 255, 165 / 255, 32 / 255); // #DAA520
const BLUE = rgb(39 / 255, 100 / 255, 255 / 255); // #2764FF
const CYAN = rgb(33 / 255, 184 / 255, 205 / 255); // #21B8CD
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(139 / 255, 148 / 255, 158 / 255); // #8B949E

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = pollExportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "No polls provided" }, { status: 400 });
  }
  const { polls } = parsed.data;

  const pdf = await PDFDocument.create();
  const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 50;
  const CONTENT_W = PAGE_W - MARGIN * 2;

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  // Fill background
  const fillPageBg = (p: typeof page) => {
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: DARK_BG });
  };
  fillPageBg(page);

  // Header
  page.drawText("KLO Poll Results", {
    x: MARGIN,
    y: y,
    size: 28,
    font: helveticaBold,
    color: WHITE,
  });
  y -= 8;

  // Gold divider
  page.drawRectangle({ x: MARGIN, y: y, width: 120, height: 3, color: GOLD });
  y -= 20;

  // Date
  page.drawText(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), {
    x: MARGIN,
    y: y,
    size: 10,
    font: helvetica,
    color: MUTED,
  });
  y -= 40;

  for (const poll of polls) {
    // Estimate space needed: title(20) + options(25 each) + padding(30)
    const needed = 50 + poll.options.length * 28;
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      fillPageBg(page);
      y = PAGE_H - MARGIN;
    }

    // Question title
    page.drawText(poll.question, {
      x: MARGIN,
      y: y,
      size: 14,
      font: helveticaBold,
      color: WHITE,
      maxWidth: CONTENT_W,
    });
    y -= 8;

    // Total votes subtitle
    page.drawText(`${poll.totalVotes} total vote${poll.totalVotes !== 1 ? "s" : ""}`, {
      x: MARGIN,
      y: y,
      size: 9,
      font: helvetica,
      color: MUTED,
    });
    y -= 22;

    const maxVotes = Math.max(...poll.votes, 1);
    const BAR_MAX_W = CONTENT_W - 120; // leave room for label + count

    for (let i = 0; i < poll.options.length; i++) {
      const label = poll.options[i];
      const count = poll.votes[i] || 0;
      const pct = poll.totalVotes > 0 ? Math.round((count / poll.totalVotes) * 100) : 0;
      const barW = Math.max((count / maxVotes) * BAR_MAX_W, 2);

      // Option label
      const truncated = label.length > 20 ? label.slice(0, 18) + "…" : label;
      page.drawText(truncated, {
        x: MARGIN,
        y: y,
        size: 10,
        font: helvetica,
        color: WHITE,
      });

      // Bar
      const barX = MARGIN + 110;
      const barColor = i % 2 === 0 ? BLUE : CYAN;

      // Background bar
      page.drawRectangle({
        x: barX,
        y: y - 2,
        width: BAR_MAX_W,
        height: 14,
        color: CARD_BG,
        borderColor: rgb(33 / 255, 38 / 255, 45 / 255),
        borderWidth: 0.5,
      });

      // Filled bar
      page.drawRectangle({
        x: barX,
        y: y - 2,
        width: barW,
        height: 14,
        color: barColor,
      });

      // Count + percentage
      page.drawText(`${count} (${pct}%)`, {
        x: barX + BAR_MAX_W + 8,
        y: y,
        size: 9,
        font: helvetica,
        color: MUTED,
      });

      y -= 24;
    }

    // Separator
    y -= 8;
    page.drawRectangle({ x: MARGIN, y: y, width: CONTENT_W, height: 0.5, color: CARD_BG });
    y -= 20;
  }

  const pdfBytes = await pdf.save();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="klo-poll-results-${Date.now()}.pdf"`,
    },
  });
}
