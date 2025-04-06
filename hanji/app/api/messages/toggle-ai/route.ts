import { NextRequest, NextResponse } from 'next/server';

// 可以訪問父目錄中的全局變量
let useAIResponse = false;

// PATCH /api/messages/toggle-ai
export async function PATCH(request: NextRequest) {
  try {
    const { useAI } = await request.json();
    
    if (typeof useAI === 'boolean') {
      // 更新全局變量
      useAIResponse = useAI;
      
      // 導出以便其他模塊使用
      exportAIStatus(useAI);
      
      return NextResponse.json({ 
        success: true, 
        useAI: useAIResponse 
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: '參數無效' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('切換 AI 時發生錯誤:', error);
    return NextResponse.json(
      { error: '切換 AI 時發生錯誤' },
      { status: 500 }
    );
  }
}

// 導出當前狀態，以便在其他模塊中使用
export function exportAIStatus(status?: boolean) {
  if (typeof status === 'boolean') {
    useAIResponse = status;
  }
  return useAIResponse;
}

// GET /api/messages/toggle-ai
export async function GET() {
  return NextResponse.json({ 
    useAI: useAIResponse 
  }, { status: 200 });
} 