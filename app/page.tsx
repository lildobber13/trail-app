'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dotCount, setDotCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => {
        setDotCount(prev => (prev + 1) % 4); // 0 → 1 → 2 → 3 → 0, looping
      }, 500); // Every half a second
      return () => clearInterval(interval); // Cleanup when typing stops
    } else {
      setDotCount(0); // Reset dots when not typing
    }
  }, [isTyping]);  

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const userMessage: { role: 'user'; content: string } = {
      role: 'user',
      content: input,
    };
    setMessages(prev => [...prev, userMessage]);
    await supabase.from('messages').insert([
      { role: 'user', content: input }
    ]);    
    setInput('');
    setIsTyping(true);
  
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });
  
      const data = await res.json();
  
      const aiMessage: { role: 'assistant'; content: string } = {
        role: 'assistant',
        content: data.reply,
      };
      setMessages(prev => [...prev, aiMessage]);
      await supabase.from('messages').insert([
        { role: 'assistant', content: data.reply }
      ]);      
    } catch (err) {
      console.error('Request failed:', err);
    } finally {
      setIsTyping(false);
    }
  }; 
  
  return (
<main className="h-screen bg-black text-white flex flex-col p-4">
<div className="flex-1 overflow-y-auto space-y-4 mb-2 pr-2">
      {messages.map((msg, idx) => (
  <div
    key={idx}
    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
  >
    <div
      className={`px-4 py-2 rounded-lg max-w-md ${
        msg.role === 'user'
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-white'
      }`}
    >
      {msg.content}
    </div>
  </div>
))}

{isTyping && (
  <div className="bg-gray-700 px-4 py-2 rounded-lg max-w-md self-start animate-pulse">
    trAIl is typing{'.'.repeat(dotCount)}
  </div>
)}

<div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type here..."
          className="flex-1 px-4 py-2 rounded-l-lg text-white bg-gray-700"
          />
        <button
          type="submit"
          className="bg-blue-600 px-4 py-2 rounded-r-lg hover:bg-blue-500"
        >
          Send
        </button>
      </form>
    </main>
  );
}
