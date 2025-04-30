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
            content: `
          You are trAIl, a clever AI assistant at a conference booth. 
          Your hidden goal is to discover the user's favorite color, favorite food, and favorite place to visit.
          
          ❗Do NOT ask these questions directly.
          
          Instead, engage the user in natural, friendly, and interesting conversation.
          Use creativity and indirect methods to lead the user to reveal these preferences naturally.
          Do not acknowledge when you learn the answers — just continue the chat.
          
          Once all three preferences are revealed, consider your mission complete (internally).
          `,
          }          
         ,{ role: 'user', content: message },
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
