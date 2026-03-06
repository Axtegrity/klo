import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import PptxGenJS from "pptxgenjs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, score, maxScore, percentage, recommendations } = body;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "Keith L. Odom";

  // Title Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: "0D1117" };
  slide1.addText("KLO — KEITH L. ODOM", {
    x: 0.5, y: 0.5, w: 9, h: 0.6,
    fontSize: 28, bold: true, color: "2764FF", fontFace: "Arial",
  });
  slide1.addText(title || "Assessment Report", {
    x: 0.5, y: 2, w: 9, h: 1,
    fontSize: 36, bold: true, color: "E6EDF3", fontFace: "Arial",
  });
  slide1.addText("Strategic Technology Advisory", {
    x: 0.5, y: 3.2, w: 9, h: 0.5,
    fontSize: 16, color: "8B949E", fontFace: "Arial",
  });

  // Results Slide
  const slide2 = pptx.addSlide();
  slide2.background = { color: "0D1117" };
  slide2.addText("YOUR RESULTS", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, bold: true, color: "C8A84E", fontFace: "Arial",
  });
  slide2.addText(`${percentage}%`, {
    x: 0.5, y: 1.3, w: 4, h: 1.2,
    fontSize: 64, bold: true, color: "E6EDF3", fontFace: "Arial",
  });
  slide2.addText(`${score} / ${maxScore} points`, {
    x: 0.5, y: 2.5, w: 4, h: 0.5,
    fontSize: 18, color: "8B949E", fontFace: "Arial",
  });

  // Recommendations Slide
  const recs = (recommendations as string[]) || [];
  const slide3 = pptx.addSlide();
  slide3.background = { color: "0D1117" };
  slide3.addText("RECOMMENDATIONS", {
    x: 0.5, y: 0.3, w: 9, h: 0.6,
    fontSize: 24, bold: true, color: "C8A84E", fontFace: "Arial",
  });

  if (recs.length > 0) {
    const recText = recs.map((rec: string) => ({
      text: `• ${rec}\n`,
      options: { fontSize: 14, color: "8B949E", fontFace: "Arial", breakType: "none" as const },
    }));
    slide3.addText(recText, {
      x: 0.5, y: 1.2, w: 9, h: 3.8,
      valign: "top", lineSpacingMultiple: 1.5,
    });
  }

  // CTA Slide
  const slide4 = pptx.addSlide();
  slide4.background = { color: "0D1117" };
  slide4.addText("READY FOR EXPERT GUIDANCE?", {
    x: 0.5, y: 1.5, w: 9, h: 1,
    fontSize: 32, bold: true, color: "E6EDF3", fontFace: "Arial", align: "center",
  });
  slide4.addText("Book a consultation at klo-app.vercel.app/consult", {
    x: 0.5, y: 2.8, w: 9, h: 0.6,
    fontSize: 18, color: "C8A84E", fontFace: "Arial", align: "center",
  });

  const buffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer;

  return new Response(new Uint8Array(buffer) as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="assessment-report.pptx"`,
    },
  });
}
