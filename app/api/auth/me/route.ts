import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionData(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        avatar: session.avatar
      }
    });
  } catch (error) {
    console.error('Error getting user session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
