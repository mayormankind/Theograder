import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { deleteFileFromSupabase } from "@/lib/supabase";

// GET /api/upload/[scriptId] - Get script processing status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> },
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { scriptId } = await params;

    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        exam: {
          createdById: session.userId,
        },
      },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
          },
        },
        results: {
          select: {
            id: true,
            status: true,
            totalScore: true,
            confidence: true,
            gradedAt: true,
          },
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    return NextResponse.json(script);
  } catch (error) {
    console.error("Error fetching script status:", error);
    return NextResponse.json(
      { error: "Failed to fetch script status" },
      { status: 500 },
    );
  }
}

// DELETE /api/upload/[scriptId] - Delete a script
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ scriptId: string }> },
) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { scriptId } = await params;

    // Check if script exists and belongs to user
    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        exam: {
          createdById: session.userId,
        },
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Delete from Supabase Storage
    try {
      await deleteFileFromSupabase("uploads", script.filePath);
    } catch (error) {
      console.error("Error deleting file from Supabase:", error);
    }

    // Delete script and associated results in transaction (cascades to QuestionResult)
    await prisma.$transaction(async (tx) => {
      await tx.result.deleteMany({
        where: { scriptId: scriptId },
      });
      await tx.script.delete({
        where: { id: scriptId },
      });
    });

    return NextResponse.json({
      message: "Script deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      { error: "Failed to delete script" },
      { status: 500 },
    );
  }
}
