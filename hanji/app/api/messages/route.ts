import { NextRequest, NextResponse } from 'next/server';

// 定义消息的接口
interface MessageRequest {
    destination: string;
    events: string;
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    // 解析请求主体
    const body: MessageRequest = await request.json();
    
    console.log(body);
    // 返回相同的消息
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error('訊息處理時發生錯誤:', error);
    return NextResponse.json(
      { error: '請求時發生錯誤' },
      { status: 500 }
    );
  }
} 