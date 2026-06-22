import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TASK_CATEGORIES,
  FALLBACK_TASK_CATEGORY,
  normalizeTaskCategory,
} from './taskCategories'

describe('taskCategories', () => {
  it('provides the default categories', () => {
    expect(DEFAULT_TASK_CATEGORIES).toEqual([
      '工作',
      '學習',
      '生活',
      '健康',
      '其他',
    ])
  })

  it('normalizes known and custom categories', () => {
    expect(normalizeTaskCategory(' 工作 ')).toBe('工作')
    expect(normalizeTaskCategory(' 個人專案 ')).toBe('個人專案')
  })

  it('uses the fallback for empty and old missing categories', () => {
    expect(normalizeTaskCategory('   ')).toBe(FALLBACK_TASK_CATEGORY)
    expect(normalizeTaskCategory(undefined)).toBe(FALLBACK_TASK_CATEGORY)
  })
})
