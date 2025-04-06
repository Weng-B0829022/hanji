import { NextRequest, NextResponse } from 'next/server';
import { getAIStatus, setAIStatus } from '../aiStatus';

// PATCH /api/messages/toggle-ai
export async function PATCH(request: NextRequest) {
  try {
    const { useAI } = await request.json();
    
    if (typeof useAI === 'boolean') {
      // 使用獨立模塊更新狀態
      const newStatus = setAIStatus(useAI);
      
      return NextResponse.json({ 
        success: true, 
        useAI: newStatus 
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

// GET /api/messages/toggle-ai
export async function GET() {
  return NextResponse.json({ 
    useAI: getAIStatus() 
  }, { status: 200 });
} 