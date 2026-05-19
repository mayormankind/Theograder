import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { id } = await params;
    const body = await request.json();
    const { read } = body;

    const updated = await prisma.notification.update({
      where: {
        id,
        userId: session.userId,
      },
      data: { read: read ?? true },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Error updating single notification:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
