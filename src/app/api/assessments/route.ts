import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";
import { resend } from "@/lib/email";
import { sendPushToUser } from "@/lib/push-server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }

  const body = await request.json();
  const { assessment_type, score, answers, recommendations } = body;

  if (!assessment_type || score === undefined || !answers) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("assessment_results")
    .insert({
      user_id: userId,
      assessment_type,
      score,
      answers,
      recommendations: recommendations || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Push notification: assessment completed
  try {
    const assessmentName = assessment_type.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    await sendPushToUser(userId, {
      title: "Assessment Complete!",
      body: `You scored ${score}% on ${assessmentName}. View your results and recommendations.`,
      url: "/profile?tab=assessments",
      tag: "assessment-complete",
    });
  } catch {
    // Don't fail the save if push fails
  }

  // Notify Keith + Tim of new assessment completion
  try {
    const userName = session.user?.name ?? session.user?.email ?? "Unknown";
    const userEmail = session.user?.email ?? "N/A";
    await resend.emails.send({
      from: "KLO Advisory <notifications@keithlodom.ai>",
      to: (process.env.ADMIN_NOTIFICATION_EMAILS ?? "").split(",").filter(Boolean),
      subject: `New Assessment Completed — ${assessment_type}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B0F1A;padding:32px;border-radius:12px;">
          <h1 style="color:#C9A84C;font-size:24px;">New Assessment Completed</h1>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            <tr><td style="padding:6px 12px;font-weight:600;color:#999;">User</td><td style="padding:6px 12px;color:#fff;">${userName}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:600;color:#999;">Email</td><td style="padding:6px 12px;color:#fff;">${userEmail}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:600;color:#999;">Assessment</td><td style="padding:6px 12px;color:#fff;">${assessment_type}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:600;color:#999;">Score</td><td style="padding:6px 12px;color:#fff;">${score}%</td></tr>
          </table>
        </div>
      `,
    });
  } catch {
    // Don't fail the assessment save if email fails
  }

  return NextResponse.json(data);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
