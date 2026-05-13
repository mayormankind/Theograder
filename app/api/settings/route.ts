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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Split name into first and last name
    const nameParts = user.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Aggregate settings (using defaults for missing schema fields)
    const settings = {
      firstName,
      lastName,
      title: "Dr.", // Default
      email: user.email,
      staffId: "STAFF-" + user.id.slice(-4).toUpperCase(), // Placeholder
      department: "Computer Science", // Default
      faculty: "Science", // Default
      avatar: user.avatar,
      confidenceThreshold: 70,
      batchSize: 20,
      autoFlag: true,
      emailNotif: true,
      systemNotif: true,
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
    const { firstName, lastName, email } = body;

    // Update user profile
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: `${firstName} ${lastName}`.trim(),
        email: email,
      },
    });

    // In a real app, we'd also save the AI/Notification settings to a per-user settings table
    // For now, we'll just acknowledge the update

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 },
    );
  }
}
