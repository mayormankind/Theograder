// lib/session.ts

import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { NextRequest, NextResponse } from "next/server";

export interface SessionData {
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  avatar?: string;
  isLoggedIn?: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD!,
  cookieName: "theograder-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

// Extract cookie options with proper types
const cookieOpts = sessionOptions.cookieOptions!;

// Get session from request (for API routes and middleware)
export async function getSession(
  request: NextRequest,
): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(request.cookies as any, sessionOptions);
}

// Get session from request - returns null if not logged in
export async function getSessionData(
  request: NextRequest,
): Promise<SessionData | null> {
  try {
    const session = await getSession(request);
    if (!session.isLoggedIn || !session.userId) {
      return null;
    }
    return session;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}

// Check if user is authenticated
export async function requireAuth(
  request: NextRequest,
): Promise<SessionData | NextResponse> {
  const session = await getSessionData(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

// Serialize session and set cookie on response
async function commitSession(
  session: IronSession<SessionData>,
  response: NextResponse,
): Promise<void> {
  // iron-session v8+ save() seals the session; we need to serialize manually for NextResponse
  const { sealData } = await import("iron-session");
  const sealed = await sealData(session, sessionOptions);

  // Set the cookie on the response
  response.cookies.set(sessionOptions.cookieName, sealed, {
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    path: cookieOpts.path,
    maxAge: cookieOpts.maxAge,
  });
}

export async function saveSession(
  request: NextRequest,
  response: NextResponse,
  data: Omit<SessionData, "isLoggedIn">,
): Promise<void> {
  const session = await getSession(request);

  session.userId = data.userId;
  session.email = data.email;
  session.name = data.name;
  session.role = data.role;
  session.avatar = data.avatar;
  session.isLoggedIn = true;

  await commitSession(session, response);
}

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
  updates: Partial<SessionData>,
): Promise<void> {
  const session = await getSession(request);

  Object.assign(session, updates);
  await commitSession(session, response);
}

export async function destroySession(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  const session = await getSession(request);
  session.destroy();

  // Clear the cookie
  response.cookies.set(sessionOptions.cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// Helper to create authenticated response with session
export async function createAuthResponse(
  request: NextRequest,
  data: Omit<SessionData, "isLoggedIn">,
  responseData?: any,
  status: number = 200,
): Promise<NextResponse> {
  const response = NextResponse.json(responseData || { success: true }, {
    status,
  });

  await saveSession(request, response, data);
  return response;
}
