import { NextRequest, NextResponse } from 'next/server';
import { actions } from './actions';
import { getAIStatus } from './aiStatus';

// LINE Bot 消息請求接口
interface LineMessageRequest {
  destination: string;
  events: LineEvent[];
}

// LINE 事件接口
interface LineEvent {
  type: string;
  message?: {
    type: string;
    id: string;
    text?: string;
  };
  timestamp: number;
  source: {
    type: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  replyToken?: string;
  mode: string;
}

// 存儲消息的接口
interface StoredMessage {
  text: string;
  timestamp: number;
  userId?: string;
  type: string;
  reply?: string;
}

// 回复結果接口
interface ReplyResult {
  success: boolean;
  reply: string | null;
}

// Gemini AI 回应接口
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// 内存中存储消息，理想情况下应该使用数据库
let messageHistory: StoredMessage[] = [];

// 使用 Gemini API 生成回复
async function generateAIResponse(message: string): Promise<string> {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error('缺少 GEMINI_API_KEY，無法使用 AI 回复');
      return '憨吉汪汪...(AI回应失敗)';
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts:[{
              text: `你將扮演一隻狗，名叫憨吉。接下來你的主人會給你一些指令，你必須設身處地回答，但是你只是一隻狗，你只會"汪"，因此你可以使用一些標點符號以及數個"汪"來回答。以下是主人的訊息：${message}`
            }]
          }]
        })
      }
    );
    
    const data: GeminiResponse = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts && data.candidates[0].content.parts[0].text) {
      return '憨吉' + data.candidates[0].content.parts[0].text;
    } else {
      console.error('Gemini API 返回格式不正確:', data);
      return '憨吉汪汪...(無法理解)';
    }
  } catch (error) {
    console.error('使用 Gemini API 生成回复時出錯:', error);
    return '憨吉不懂....汪汪汪汪汪(無法理解)';
  }
}

// 從動作列表中獲取回复內容
function getReplyFromActions(message: string): string {
  // 隨機數來決定是否使用通用回复
  const useGeneric = Math.random() < 0.7; // 70% 機率使用通用回复
  
  // 檢查消息中是否包含特定動作關鍵詞
  let matchedAction = '';
  for (const action in actions) {
    if (action !== '通用' && message.includes(action)) {
      matchedAction = action;
      break;
    }
  }
  
  let responses: string[] = [];
  
  // 如果找到匹配的動作且不使用通用回复
  if (matchedAction && !useGeneric) {
    responses = actions[matchedAction as keyof typeof actions] as string[];
  } else {
    // 使用通用回复
    responses = actions['通用'] as string[];
  }
  
  // 從可能的回复中隨機選擇一個
  const randomIndex = Math.floor(Math.random() * responses.length);
  return '憨吉' + responses[randomIndex];
}

// 回复消息到 LINE
async function replyToLine(replyToken: string, message: string): Promise<ReplyResult> {
  // 獲取 LINE Messaging API Channel Access Token
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error('缺少 LINE Channel Access Token，無法回复消息');
    return { success: false, reply: null };
  }
  
  // 從獨立模塊獲取當前 AI 狀態
  const useAIResponse = getAIStatus();
  
  // 根據設置選擇回复方式
  let replyText: string;
  
  if (useAIResponse) {
    // 使用 AI 生成回复
    replyText = await generateAIResponse(message);
  } else {
    // 使用預設的回复模式
    replyText = getReplyFromActions(message);
  }
  
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken: replyToken,
        messages: [
          {
            type: 'text',
            text: replyText
          }
        ]
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('LINE 回复失敗:', result);
      return { success: false, reply: null };
    }
    
    return { success: true, reply: replyText };
  } catch (error) {
    console.error('發送 LINE 回复時出錯:', error);
    return { success: false, reply: null };
  }
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    // 解析請求主體
    const body: LineMessageRequest = await request.json();
    
    console.log('收到 LINE 事件:', body);
    
    // 只處理消息事件
    const messageEvents = body.events.filter(event => event.type === 'message' && event.message?.type === 'text');
    
    if (messageEvents.length > 0) {
      // 處理每個消息事件
      const newMessages: StoredMessage[] = [];
      
      for (const event of messageEvents) {
        const originalText = event.message?.text || '';
        let replyResult: ReplyResult = { success: false, reply: null };
        
        // 檢查消息是否包含「憨吉」
        const shouldReply = originalText.includes('憨吉');
        
        // 如果消息包含「憨吉」且有回复令牌，才發送回复
        if (shouldReply && event.replyToken) {
          replyResult = await replyToLine(event.replyToken, originalText);
          console.log('觸發憨吉回應:', originalText);
        } else if (!shouldReply) {
          console.log('未提到憨吉，不觸發回應:', originalText);
        }
        
        // 存儲消息
        newMessages.push({
          text: originalText,
          timestamp: event.timestamp,
          userId: event.source.userId,
          type: event.message?.type || 'unknown',
          reply: replyResult.success && replyResult.reply ? replyResult.reply : undefined
        }); 
      }
      
      // 添加到歷史記錄
      messageHistory = [...messageHistory, ...newMessages];
      
      // 限制存儲的消息數量，保留最新的100條
      if (messageHistory.length > 100) {
        messageHistory = messageHistory.slice(messageHistory.length - 100);
      }
      
      console.log('已處理並存儲消息事件:', newMessages);
    }
    
    // 返回確認
    return NextResponse.json({ 
      success: true, 
      messageCount: messageEvents.length 
    }, { status: 200 });
  } catch (error) {
    console.error('訊息處理時發生錯誤:', error);
    return NextResponse.json(
      { error: '請求時發生錯誤' },
      { status: 500 }
    );
  }
}

// GET /api/messages
export async function GET() {
  try {
    // 從獨立模塊獲取當前 AI 狀態
    const useAIStatus = getAIStatus();
    
    // 返回所有存儲的消息和當前 AI 狀態
    return NextResponse.json({ 
      messages: messageHistory,
      useAI: useAIStatus
    }, { status: 200 });
  } catch (error) {
    console.error('獲取消息時發生錯誤:', error);
    return NextResponse.json(
      { error: '獲取消息時發生錯誤' },
      { status: 500 }
    );
  }
} 