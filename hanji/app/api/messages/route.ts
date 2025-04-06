import { NextRequest, NextResponse } from 'next/server';

// 定义消息的接口
interface MessageRequest {
  description: string;
  event: string;
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    // 解析请求主体
    const body: MessageRequest = await request.json();
    
    // 构建响应
    const responseData = {
      description: body.description,
      event: body.event,
      timestamp: new Date().toISOString(),
      status: 'success'
    };
    
    // 返回相同的消息
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('处理消息时出错:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误' },
      { status: 500 }
    );
  }
} 