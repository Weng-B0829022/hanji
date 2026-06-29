import { NextRequest, NextResponse } from 'next/server';
import { prompt } from './prompt';

interface LineMessageRequest {
  destination: string;
  events: LineEvent[];
}

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

interface StoredMessage {
  text: string;
  timestamp: number;
  userId?: string;
  type: string;
  reply?: string;
}

interface ReplyResult {
  success: boolean;
  reply: string | null;
}

let messageHistory: StoredMessage[] = [];

async function generateAIResponse(message: string): Promise<string> {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error('缺少 OPENAI_API_KEY');
      return '汪汪...(AI回應失敗)';
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        instructions: prompt,
        input: message,
        tools: [{ type: 'web_search_preview' }],
      }),
    });

    const data = await response.json();

    // Responses API 回傳 output 陣列，找第一個 message 類型的內容
    const messageOutput = data.output?.find((o: { type: string }) => o.type === 'message');
    const text = messageOutput?.content?.find((c: { type: string }) => c.type === 'output_text')?.text;

    if (text) {
      return text;
    } else {
      console.error('Responses API 返回格式不正確:', JSON.stringify(data));
      return '汪汪...(無法理解)';
    }
  } catch (error) {
    console.error('使用 OpenAI API 生成回复時出錯:', error);
    return '不懂....汪汪汪汪汪(無法理解)';
  }
}

async function replyToLine(replyToken: string, message: string): Promise<ReplyResult> {
  const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!CHANNEL_ACCESS_TOKEN) {
    console.error('缺少 LINE Channel Access Token');
    return { success: false, reply: null };
  }

  const replyText = await generateAIResponse(message);

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text: replyText }],
      }),
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
    const body: LineMessageRequest = await request.json();

    console.log('收到 LINE 事件:', body);

    const messageEvents = body.events.filter(
      (event) => event.type === 'message' && event.message?.type === 'text'
    );

    if (messageEvents.length > 0) {
      const newMessages: StoredMessage[] = [];

      for (const event of messageEvents) {
        const originalText = event.message?.text || '';
        let replyResult: ReplyResult = { success: false, reply: null };

        const shouldReply = originalText.includes('憨吉');

        if (shouldReply && event.replyToken) {
          replyResult = await replyToLine(event.replyToken, originalText);
          console.log('觸發憨吉回應:', originalText);
        } else if (!shouldReply) {
          console.log('未提到憨吉，不觸發回應:', originalText);
        }

        newMessages.push({
          text: originalText,
          timestamp: event.timestamp,
          userId: event.source.userId,
          type: event.message?.type || 'unknown',
          reply: replyResult.success && replyResult.reply ? replyResult.reply : undefined,
        });
      }

      messageHistory = [...messageHistory, ...newMessages];

      if (messageHistory.length > 100) {
        messageHistory = messageHistory.slice(messageHistory.length - 100);
      }

      console.log('已處理並存儲消息事件:', newMessages);
    }

    return NextResponse.json({ success: true, messageCount: messageEvents.length }, { status: 200 });
  } catch (error) {
    console.error('訊息處理時發生錯誤:', error);
    return NextResponse.json({ error: '請求時發生錯誤' }, { status: 500 });
  }
}

// GET /api/messages
export async function GET() {
  try {
    return NextResponse.json({ messages: messageHistory }, { status: 200 });
  } catch (error) {
    console.error('獲取消息時發生錯誤:', error);
    return NextResponse.json({ error: '獲取消息時發生錯誤' }, { status: 500 });
  }
} 