
import { NextRequest, NextResponse } from 'next/server';
import { generateImage } from '@/ai/flows/generate-image-flow';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    const result = await generateImage({ prompt });

    if (!result.imageUrl) {
      throw new Error('No image data received from the generation service.');
    }
    
    // The image URL is a data URI, like `data:image/png;base64,...`
    // The client expects `base64Image` which is just the base64 part.
    const base64Image = result.imageUrl.split(',')[1];

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
