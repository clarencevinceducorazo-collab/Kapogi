
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/ai/flows/generate-text-flow';

export async function POST(request: NextRequest) {
  let type = 'unknown';
  try {
    const body = await request.json();
    const prompt = body.prompt;
    type = body.type;

    const result = await generateText({ prompt });
    const generatedText = result.text.trim();

    let fallback = '';
    if (type === 'name') fallback = 'Pogi';
    else if (type === 'country') fallback = 'a foreign land';
    else if (type === 'lore') fallback = 'Failed to generate lore.';

    const text = generatedText || fallback;

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Text generation error:', error);

    let fallback = '';
    if (type === 'name') fallback = 'Pogi';
    else if (type === 'country') fallback = 'a foreign land';
    else if (type === 'lore') fallback = 'Failed to generate lore.';
    
    // The original code returned 200 status with fallback text on error,
    // which is what we will do here as well.
    return NextResponse.json({ text: fallback }, { status: 200 });
  }
}
