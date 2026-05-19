import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";

// GET /api/settings - Fetch all user settings
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        title: true,
        staffId: true,
        department: true,
        faculty: true,
        confidenceThreshold: true,
        batchSize: true,
        autoFlag: true,
        emailNotif: true,
        systemNotif: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Split name into first and last name
    const nameParts = user.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Aggregate settings using database fields
    const settings = {
      firstName,
      lastName,
      title: user.title || "Dr.",
      email: user.email,
      staffId: user.staffId || "STAFF-" + user.id.slice(-4).toUpperCase(),
      department: user.department || "Computer Science",
      faculty: user.faculty || "Science",
      avatar: user.avatar,
      confidenceThreshold: user.confidenceThreshold,
      batchSize: user.batchSize,
      autoFlag: user.autoFlag,
      emailNotif: user.emailNotif,
      systemNotif: user.systemNotif,
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
}

// POST /api/settings - Update user settings
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email,
      title,
      department,
      faculty,
      confidenceThreshold,
      batchSize,
      autoFlag,
      emailNotif,
      systemNotif
    } = body;

    // Update user profile and configuration settings in the database
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: `${firstName} ${lastName}`.trim(),
        email: email,
        title: title || "Dr.",
        department: department || "Computer Science",
        faculty: faculty || "Science",
        confidenceThreshold: parseInt(confidenceThreshold) || 70,
        batchSize: parseInt(batchSize) || 20,
        autoFlag: autoFlag ?? true,
        emailNotif: emailNotif ?? true,
        systemNotif: systemNotif ?? true,
      },
    });

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}

