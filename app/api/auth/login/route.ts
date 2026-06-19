import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/services/email-service';
import { createAuthResponse } from '@/lib/session';
import { logActivity, getClientMeta } from '@/lib/services/activity-log';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, useOTP = false } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is not active. Please verify your email first.' },
        { status: 401 }
      );
    }

    if (useOTP) {
      // Generate and send OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store hashed OTP — plain-text OTP is only sent via email, never persisted
      const hashedOtp = hashToken(otp);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          otpCode: hashedOtp,
          otpExpiresAt: otpExpiresAt
        }
      });

      // Send OTP email
      const emailSent = await emailService.sendOTPEmail(user.email, user.name, otp);

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send OTP. Please try again.' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { message: 'OTP sent to your email' },
        { status: 200 }
      );

    } else {
      // Password authentication
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required' },
          { status: 400 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      const { ipAddress, userAgent } = getClientMeta(request);
      await logActivity({
        userId: user.id,
        action: 'USER_LOGIN',
        resource: 'user',
        resourceId: user.id,
        metadata: { method: 'password' },
        ipAddress,
        userAgent,
      });

      const response = await createAuthResponse(
        request,
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar || undefined
        },
        {
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar
          }
        },
        200
      );

      return response;
    }

  } catch (error) {
    console.error('Login error:', error);
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('database') || error.message.includes('prisma')) {
        return NextResponse.json(
          { error: 'Database connection error. Please check your database setup.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare hashed OTP
    if (!user.otpCode || user.otpCode !== hashToken(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      );
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: null, lastLoginAt: new Date() }
    });

    const { ipAddress, userAgent } = getClientMeta(request);
    await logActivity({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'user',
      resourceId: user.id,
      metadata: { method: 'otp' },
      ipAddress,
      userAgent,
    });

    const response = await createAuthResponse(
      request,
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || undefined
      },
      {
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        }
      },
      200
    );

    return response;

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
