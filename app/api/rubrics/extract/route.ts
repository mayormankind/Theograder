// app/api/rubrics/extract/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';

// POST /api/rubrics/extract - Extract rubric from document via AI service
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    if (session instanceof NextResponse) return session;

    // Get AI service URL from environment
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF and image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Create a new FormData to send to AI service
    const aiFormData = new FormData();
    aiFormData.append('file', file);

    // Call AI service
    const response = await fetch(`${aiServiceUrl}/rubric/extract/from-document`, {
      method: 'POST',
      body: aiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to extract rubric from document', details: errorText },
        { status: response.status }
      );
    }

    const extractedRubric = await response.json();

    // Format the response to match our expected structure
    const formattedRubric = {
      title: extractedRubric.title || 'Extracted Rubric',
      description: extractedRubric.description || 'Rubric extracted from document',
      questions: extractedRubric.questions || [],
      totalMarks: extractedRubric.totalMarks || 0,
      isPreview: true, // Mark as preview so user can review before saving
    };

    return NextResponse.json(formattedRubric);

  } catch (error) {
    console.error('Error extracting rubric:', error);
    
    // Check if it's a network/connection error
    if (error instanceof Error) {
      if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
        return NextResponse.json(
          { error: 'AI service is unavailable. Please check your connection and try again.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to extract rubric from document' },
      { status: 500 }
    );
  }
}

// GET /api/rubrics/extract - Health check for AI service
export async function GET() {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${aiServiceUrl}/`, {
      method: 'GET',
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          status: 'unhealthy',
          error: 'AI service is not responding',
          aiServiceUrl 
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      aiServiceUrl,
      message: 'AI service is available',
    });

  } catch (error) {
    console.error('AI service health check error:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Cannot connect to AI service',
        aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000'
      },
      { status: 503 }
    );
  }
}
