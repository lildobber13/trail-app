import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { message } = await req.json();

  try {
    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant named trAIl helping at a conference.',
          },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const data = await apiRes.json();
    return NextResponse.json({ reply: data.choices[0].message.content });

  } catch (error) {
    return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
  }
}
