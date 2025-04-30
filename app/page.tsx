'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabaseClient';
import loadingAnimation from '../public/animations/loading-bar.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export default function Home() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dotCount, setDotCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [favorites, setFavorites] = useState({ color: '', food: '', place: '' });

  const bottomRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<any>(null);

  useEffect(() => {
    if (isTyping) {
      const interval = setInterval(() => setDotCount((prev) => (prev + 1) % 4), 500);
      return () => clearInterval(interval);
    } else {
      setDotCount(0);
    }
  }, [isTyping]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const anim = animationRef.current;
    if (!anim) return;
    isTyping ? setTimeout(() => anim.play(), 100) : anim.stop();
  }, [isTyping]);

  useEffect(() => {
    const { color, food, place } = favorites;
    if (color && food && place) {
      setShowSuccess(true);
    }
  }, [favorites]);

  const checkForFavorites = (text: string) => {
    const lower = text.toLowerCase();

    if (!favorites.color && /\\b(red|blue|green|yellow|purple|orange|pink|black|white|gray)/.test(lower)) {
      const match = lower.match(/(red|blue|green|yellow|purple|orange|pink|black|white|gray)/);
      if (match) setFavorites((prev) => ({ ...prev, color: match[0] }));
    }
    if (!favorites.food && /\\b(pizza|burger|pasta|sushi|steak|chicken|tacos|ice cream|salad)/.test(lower)) {
      const match = lower.match(/(pizza|burger|pasta|sushi|steak|chicken|tacos|ice cream|salad)/);
      if (match) setFavorites((prev) => ({ ...prev, food: match[0] }));
    }
    if (!favorites.place && /\\b(paris|hawaii|japan|italy|new york|london|beach|mountains)/.test(lower)) {
      const match = lower.match(/(paris|hawaii|japan|italy|new york|london|beach|mountains)/);
      if (match) setFavorites((prev) => ({ ...prev, place: match[0] }));
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: { role: 'user'; content: string } = {
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    checkForFavorites(input);
    await supabase.from('messages').insert([{ role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      const aiMessage: { role: 'assistant'; content: string } = {
        role: 'assistant',
        content: data.reply,
      };
      setMessages((prev) => [...prev, aiMessage]);
      checkForFavorites(data.reply);
      await supabase.from('messages').insert([{ role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('Request failed:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="h-screen bg-gray-900 text-white flex flex-col justify-between p-4 max-w-screen-md mx-auto">
      {/* Lottie animation */}
      <div className="h-[100px] flex items-center justify-center shrink-0">
        <Lottie
          lottieRef={animationRef}
          animationData={loadingAnimation}
          loop
          autoplay={false}
          className="h-24 w-24 opacity-70 drop-shadow-[0_0_30px_rgba(0,255,255,0.35)]"
        />
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto space-y-4 px-2 pr-2">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2 rounded-lg max-w-md ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}>
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

      {/* Input form */}
      <form onSubmit={handleSend} className="flex gap-1 mt-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type here..."
          className="flex-1 px-4 py-2 rounded-lg text-white bg-gray-700"
        />
        <button type="submit" className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500">
          Send
        </button>
      </form>

      {/* Success overlay */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-90 text-white flex flex-col items-center justify-center z-50">
          <h1 className="text-4xl font-bold mb-4">🎉 Mission Accomplished!</h1>
          <p className="mb-2">Favorite Color: {favorites.color}</p>
          <p className="mb-2">Favorite Food: {favorites.food}</p>
          <p className="mb-2">Favorite Place: {favorites.place}</p>
          <button
            onClick={() => setShowSuccess(false)}
            className="mt-4 bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-500"
          >
            Continue
          </button>
        </div>
      )}
    </main>
  );
}