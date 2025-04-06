// 全局變量存儲 AI 切換狀態
let useAIResponse = false;

// 更新 AI 使用狀態
export function setAIStatus(status: boolean): boolean {
  useAIResponse = status;
  return useAIResponse;
}

// 獲取當前 AI 使用狀態
export function getAIStatus(): boolean {
  return useAIResponse;
} 