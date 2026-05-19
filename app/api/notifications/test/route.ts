import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { notificationService } from "@/lib/services/notification-service";
import { NotificationType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json().catch(() => ({}));
    const { type, title, message, link, metadata } = body;

    const result = await notificationService.notify({
      userId: session.userId!,
      type: type || NotificationType.SYSTEM_ERROR,
      title: title || "Test Notification Alert",
      message: message || "This is a diagnostic notification sent to verify routing and dispatch configurations.",
      link: link || "/dashboard",
      metadata: metadata || { test: true }
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Test notification dispatch fail:", error);
    return NextResponse.json({ error: "System failure during test" }, { status: 500 });
  }
}
