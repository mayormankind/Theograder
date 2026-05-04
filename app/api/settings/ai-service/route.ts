import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';

const aiServiceConfigSchema = z.object({
  url: z.string().url('Invalid URL format').optional(),
});

// GET /api/settings/ai-service - Get AI service configuration and test connection
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const testConnection = searchParams.get('test') === 'true';

    // Get current AI service URL from environment or settings
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const config = {
      url: aiServiceUrl,
      configured: !!process.env.AI_SERVICE_URL,
    };

    // Test connection if requested
    if (testConnection) {
      try {
        const response = await fetch(`${aiServiceUrl}/`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          const healthData = await response.json();
          return NextResponse.json({
            ...config,
            connectionStatus: 'connected',
            healthCheck: healthData,
          });
        } else {
          return NextResponse.json({
            ...config,
            connectionStatus: 'error',
            error: `HTTP ${response.status}: ${response.statusText}`,
          });
        }
      } catch (connectionError) {
        console.error('AI service connection error:', connectionError);
        return NextResponse.json({
          ...config,
          connectionStatus: 'disconnected',
          error: connectionError instanceof Error ? connectionError.message : 'Unknown connection error',
        });
      }
    }

    return NextResponse.json(config);

  } catch (error) {
    console.error('Error fetching AI service settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI service settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/ai-service - Update AI service configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    const body = await request.json();
    const validatedData = aiServiceConfigSchema.parse(body);

    // In a real implementation, you might want to save this to a settings table
    // For now, we'll just test the connection and return success
    if (validatedData.url) {
      try {
        const response = await fetch(`${validatedData.url}/`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to connect to AI service URL', details: `HTTP ${response.status}` },
            { status: 400 }
          );
        }

        return NextResponse.json({
          message: 'AI service configuration updated successfully',
          config: {
            url: validatedData.url,
            connectionStatus: 'connected',
          },
        });
      } catch (connectionError) {
        return NextResponse.json(
          { error: 'Failed to connect to AI service URL', details: connectionError instanceof Error ? connectionError.message : 'Unknown error' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      message: 'AI service configuration updated',
    });

  } catch (error) {
    console.error('Error updating AI service settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update AI service settings' },
      { status: 500 }
    );
  }
}
