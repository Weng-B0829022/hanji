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
  useAI: boolean;
  error?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<LineMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState<boolean>(false);
  const [aiToggleLoading, setAiToggleLoading] = useState<boolean>(false);

  // 獲取消息
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages');
      const data: ApiResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        if (data.messages) {
          setMessages(data.messages);
        }
        
        if (typeof data.useAI === 'boolean') {
          setUseAI(data.useAI);
        }
      }
    } catch (error) {
      console.error('獲取訊息時出錯:', error);
      setError('無法獲取消息，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 切換 AI 回應
  const toggleAI = async () => {
    try {
      setAiToggleLoading(true);
      const response = await fetch('/api/messages/toggle-ai', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useAI: !useAI }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else if (typeof data.useAI === 'boolean') {
        setUseAI(data.useAI);
      }
    } catch (error) {
      console.error('切換 AI 時出錯:', error);
      setError('切換 AI 失敗，請稍後再試');
    } finally {
      setAiToggleLoading(false);
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">設置</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm">使用 AI 回應:</span>
              <button 
                onClick={toggleAI}
                disabled={aiToggleLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${useAI ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useAI ? 'translate-x-6' : 'translate-x-1'
                  } ${aiToggleLoading ? 'opacity-70' : ''}`}
                />
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-sm">
            <p>{useAI ? '目前使用 AI (Gemini) 產生憨吉的回應' : '目前使用隨機產生憨吉的回應'}</p>
          </div>
        </div>

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
            <p>憨吉的回應模式：</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>
                <strong>隨機回應模式：</strong> 如果您的消息中包含特定指令（如「過來」、「坐下」等），憨吉有 30% 的機率會執行對應的動作，其餘 70% 的機率或沒有特定指令時，憨吉會隨機回应一個通用動作
              </li>
              <li>
                <strong>AI 回應模式：</strong> 使用 Gemini AI 模型產生更智能的回應，以「汪」為主，但能理解您的指令並做出類似狗的反應
              </li>
            </ul>
            <p>您可以使用頂部的切換按鈕隨時切換這兩種模式。</p>
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
