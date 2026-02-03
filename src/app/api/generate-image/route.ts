import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    
    // Use EXACT endpoint from your working code
    const imageApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
    
    const payload = {
      instances: [{ prompt }],  // Array format
      parameters: { sampleCount: 1 }
    };

    console.log('Request URL:', imageApiUrl);
    console.log('Request payload:', JSON.stringify(payload));

    const response = await fetch(imageApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    const base64Image = result?.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      throw new Error('No image data received');
    }

    return NextResponse.json({ base64Image });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
