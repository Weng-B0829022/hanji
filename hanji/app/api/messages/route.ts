import { NextRequest, NextResponse } from 'next/server';

// 定义消息的接口
interface MessageRequest {
  message: string;
}

// POST /api/messages
export async function POST(request: NextRequest) {
  try {
    // 解析请求主体
    const body: MessageRequest = await request.json();
    
    // 检查消息是否存在
    if (!body.message) {
      return NextResponse.json(
        { error: '消息不能为空' },
        { status: 400 }
      );
    }
    
    // 构建响应
    const responseData = {
      message: body.message,
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