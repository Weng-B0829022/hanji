'use client';

import { useState, useEffect } from "react";

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

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages');
      const data: ApiResponse = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessages(data.messages ?? []);
      }
    } catch (err) {
      console.error('獲取訊息時出錯:', err);
      setError('無法獲取消息，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-8 pb-20 gap-8 font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-center py-4">
        <h1 className="text-2xl font-bold">憨吉 LINE Bot 訊息系統</h1>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex-1 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">消息記錄</h2>
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
                          憨吉回覆 | {new Date(msg.timestamp + 100).toLocaleString()}
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
          <h2 className="text-xl font-bold mb-2">使用說明</h2>
          <p className="text-red-500 font-medium">只有在消息中提到「憨吉」時，憨吉才會回應！</p>
          <div className="bg-yellow-100 dark:bg-yellow-800 p-3 rounded-lg mt-3 text-sm">
            <p className="font-medium">範例：</p>
            <p>「憨吉，過來」→ 觸發回應</p>
            <p>「過來坐下」→ 不觸發（沒提到憨吉）</p>
          </div>
        </div>
      </main>

      <footer className="flex justify-center">
        <span className="text-sm text-gray-500">
          憨吉 LINE Bot 訊息系統 © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
