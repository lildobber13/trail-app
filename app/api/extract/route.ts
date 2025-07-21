import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { messages } = await req.json();

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
            content: `
You're a helpful AI. From the following chat history, extract the user's favorite color, favorite food, and favorite place to visit — if they've been mentioned. Return only the values in this format:

{
  "color": "blue",
  "food": "pizza",
  "place": "Japan"
}

If any are not mentioned, return null for those.
            `.trim(),
          },
          {
            role: 'user',
            content: JSON.stringify(messages),
          },
        ],
      }),
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const data = await apiRes.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      color: parsed.color || null,
      food: parsed.food || null,
      place: parsed.place || null,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to extract favorites.' }, { status: 500 });
  }
}
