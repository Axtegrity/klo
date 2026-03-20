import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { broadcastPush, sendPushToUser, sendPushToUsers } from "@/lib/push-server";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only owner/admin can send push notifications
  const role = (session.user as { role?: string }).role;
  if (!["owner", "admin"].includes(role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { title, body, url, tag, userId, userIds } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "title and body are required" },
        { status: 400 }
      );
    }

    const payload = { title, body, url, tag };

    let result;
    if (userId) {
      // Send to a specific user
      result = await sendPushToUser(userId, payload);
    } else if (userIds && Array.isArray(userIds)) {
      // Send to specific users
      result = await sendPushToUsers(userIds, payload);
    } else {
      // Broadcast to all subscribers
      result = await broadcastPush(payload);
    }

    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
