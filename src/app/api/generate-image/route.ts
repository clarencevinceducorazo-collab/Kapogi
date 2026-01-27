
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const imageApiUrl = process.env.NEXT_PUBLIC_GEMINI_IMAGE_API;

    if (!imageApiUrl) {
      throw new Error("Gemini Image API URL is not configured.");
    }

    const payload = {
      instances: [{ prompt }],
      parameters: { sampleCount: 1 }
    };

    const response = await fetch(imageApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
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
