type ChatMessage = {
    role: string;
    content: string;
  };  

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    const { messages }: { messages: ChatMessage[] } = await req.json();

  const prompt = `
Given the following conversation, extract the user's favorite color, favorite food, and favorite place to visit if mentioned. 
Return them as JSON like this:
{
  "color": "blue",
  "food": "sushi",
  "place": "Hawaii"
}
If any are missing, use null.

Conversation:

${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a JSON extraction assistant.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0,
    });

    const reply = completion.choices[0]?.message?.content;

if (reply) {
  const jsonStart = reply.indexOf('{');
  const jsonEnd = reply.lastIndexOf('}') + 1;

  if (jsonStart !== -1 && jsonEnd !== -1) {
    const jsonString = reply.slice(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString || '{}');
    return NextResponse.json(parsed);
  }
}
    return NextResponse.json({ color: null, food: null, place: null });
  } catch (err) {
    console.error('AI Extraction error:', err);
    return NextResponse.json({ error: 'Failed to extract' }, { status: 500 });
  }
}