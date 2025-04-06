'use client';

import { useState, FormEvent } from "react";
import Image from "next/image";

interface Message {
  message: string;
  timestamp: string;
  status: string;
}

export default function Home() {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      const data: Message = await response.json();
      setMessages(prev => [...prev, data]);
      setMessage('');
    } catch (error) {
      console.error('發送訊息時出錯:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-8 pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-center py-4">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={120}
          height={30}
          priority
        />
      </header>
      
      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 overflow-auto">
          <h2 className="text-xl font-bold mb-4">訊息記錄</h2>
          
          {messages.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              還沒有訊息，請發送您的第一條訊息！
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="mb-2">{msg.message}</p>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>狀態: {msg.status}</span>
                    <span>{new Date(msg.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-col gap-4">
            <label htmlFor="message" className="font-medium">
              發送訊息
            </label>
            <textarea
              id="message"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 min-h-[100px] bg-transparent"
              placeholder="輸入您的訊息..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium h-12 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '發送中...' : '發送訊息'}
            </button>
          </div>
        </form>
      </main>
      
      <footer className="flex gap-[24px] flex-wrap items-center justify-center">
        <span className="text-sm text-gray-500">
          憨吉訊息系統 © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
