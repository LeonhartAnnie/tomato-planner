export const DEFAULT_TASK_CATEGORIES = [
  '工作',
  '學習',
  '生活',
  '健康',
  '其他',
] as const

export const CUSTOM_TASK_CATEGORY_OPTION = '自訂'
export const FALLBACK_TASK_CATEGORY = '其他'

export const normalizeTaskCategory = (input?: string): string => {
  const normalized = input?.trim()
  return normalized || FALLBACK_TASK_CATEGORY
}
