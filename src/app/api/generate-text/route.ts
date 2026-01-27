
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, prompt } = await request.json();

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Response:', errorText);
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    let fallback = '';
    if (type === 'name') fallback = 'Pogi';
    else if (type === 'country') fallback = 'a foreign land';
    else if (type === 'lore') fallback = 'Failed to generate lore.';

    const text = generatedText || fallback;

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('Text generation error:', error);

    const { type } = await request.json().catch(() => ({ type: 'unknown' }));
    let fallback = '';
    if (type === 'name') fallback = 'Pogi';
    else if (type === 'country') fallback = 'a foreign land';
    else if (type === 'lore') fallback = 'Failed to generate lore.';

    return NextResponse.json({ text: fallback }, { status: 200 });
  }
}
