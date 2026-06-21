export const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '發生未知錯誤'
