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
}

// 内存中存储消息，理想情况下应该使用数据库
let messageHistory: StoredMessage[] = [];

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    // 解析請求主體
    const body: LineMessageRequest = await request.json();
    
    console.log('收到 LINE 事件:', body);
    
    // 只處理消息事件
    const messageEvents = body.events.filter(event => event.type === 'message' && event.message?.type === 'text');
    
    if (messageEvents.length > 0) {
      // 存儲消息以便於前端顯示
      const newMessages = messageEvents.map(event => ({
        text: event.message?.text || '',
        timestamp: event.timestamp,
        userId: event.source.userId,
        type: event.message?.type || 'unknown'
      }));
      
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