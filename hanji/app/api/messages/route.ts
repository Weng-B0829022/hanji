import { NextRequest, NextResponse } from 'next/server';

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

// 内存中存储消息，理想情况下应该使用数据库
let messageHistory: StoredMessage[] = [];

// 回复消息到 LINE
async function replyToLine(replyToken: string, message: string) {
  // 獲取 LINE Messaging API Channel Access Token
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error('缺少 LINE Channel Access Token，無法回复消息');
    return false;
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
            text: `${message} 汪汪！`
          }
        ]
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('LINE 回复失敗:', result);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('發送 LINE 回复時出錯:', error);
    return false;
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
        let replySuccess = false;
        
        // 如果有回复令牌，發送回复
        if (event.replyToken) {
          replySuccess = await replyToLine(event.replyToken, originalText);
        }
        
        // 存儲消息
        newMessages.push({
          text: originalText,
          timestamp: event.timestamp,
          userId: event.source.userId,
          type: event.message?.type || 'unknown',
          reply: replySuccess ? `${originalText} 汪汪！` : undefined
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
    // 返回所有存儲的消息
    return NextResponse.json({ 
      messages: messageHistory 
    }, { status: 200 });
  } catch (error) {
    console.error('獲取消息時發生錯誤:', error);
    return NextResponse.json(
      { error: '獲取消息時發生錯誤' },
      { status: 500 }
    );
  }
} 