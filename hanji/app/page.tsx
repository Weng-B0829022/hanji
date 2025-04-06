'use client';

import { useState, useEffect } from "react";
import Image from "next/image";

interface LineMessage {
  text: string;
  timestamp: number;
  userId?: string;
  type: string;
  reply?: string;
}

interface ApiResponse {
  messages: LineMessage[];
  error?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<LineMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 獲取消息
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages');
      const data: ApiResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('獲取訊息時出錯:', error);
      setError('無法獲取消息，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 頁面加載時獲取消息
  useEffect(() => {
    fetchMessages();
    
    // 設置輪詢，每5秒檢查一次新消息
    const interval = setInterval(fetchMessages, 5000);
    
    // 組件卸載時清除輪詢
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-8 pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-center py-4">
        <div className="flex flex-col items-center">
          <Image
            className="dark:invert mb-2"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={30}
            priority
          />
          <h1 className="text-2xl font-bold">LINE Bot 消息接收器</h1>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">接收到的消息記錄</h2>
            <button 
              onClick={fetchMessages}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              disabled={loading}
            >
              {loading ? '載入中...' : '刷新'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              還沒有接收到任何 LINE 消息，請等待消息推送。
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="mb-3">
                    <div className="flex items-start space-x-2">
                      <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded-lg inline-block max-w-[85%]">
                        <p className="text-lg">{msg.text}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-1">
                      用戶 ID: {msg.userId || '未知'} | {new Date(msg.timestamp).toLocaleString()}
                    </div>
                  </div>
                  
                  {msg.reply && (
                    <div className="flex justify-end mb-1">
                      <div className="flex flex-col items-end">
                        <div className="bg-green-100 dark:bg-green-800 p-3 rounded-lg inline-block max-w-[85%]">
                          <p className="text-lg">{msg.reply}</p>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 mr-1">
                          機器人回复 | {new Date(msg.timestamp + 100).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">使用說明</h2>
          <div className="space-y-2">
            <p>此頁面顯示從 LINE Bot 接收到的文字消息及機器人的回复。</p>
            <p>系統會自動每 5 秒刷新一次，您也可以點擊「刷新」按鈕手動更新。</p>
            <p>目前機器人會回复用戶的原始消息並在後面加上「汪汪！」。</p>
            <p>請確保已設置 LINE_CHANNEL_ACCESS_TOKEN 環境變量。</p>
          </div>
        </div>
      </main>
      
      <footer className="flex gap-[24px] flex-wrap items-center justify-center">
        <span className="text-sm text-gray-500">
          憨吉 LINE Bot 訊息系統 © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
