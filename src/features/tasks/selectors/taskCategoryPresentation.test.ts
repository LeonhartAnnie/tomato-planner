import { describe, expect, it } from 'vitest'
import { getTaskCategoryPresentation } from './taskCategoryPresentation'
import { getScheduledBlockCategoryPresentation } from './taskCategoryPresentation'
import type { ScheduledBlock, Task } from '../../../types'

describe('getTaskCategoryPresentation', () => {
  it('maps known categories to stable presentation tokens', () => {
    expect(getTaskCategoryPresentation('學習')).toEqual({
      label: '學習',
      cssClassName: 'category-study',
    })
  })

  it('uses a custom token for custom categories', () => {
    expect(getTaskCategoryPresentation(' 個人專案 ')).toEqual({
      label: '個人專案',
      cssClassName: 'category-custom',
    })
  })

  it('shows old tasks without categories as other', () => {
    expect(getTaskCategoryPresentation()).toEqual({
      label: '其他',
      cssClassName: 'category-other',
    })
  })

  it('resolves a scheduled block category from its task', () => {
    const block = { taskId: 'task-1' } as ScheduledBlock
    const tasks = [{ id: 'task-1', category: '健康' }] as Task[]

    expect(getScheduledBlockCategoryPresentation(block, tasks).label).toBe(
      '健康',
    )
  })

  it('uses other when a scheduled block task is unavailable', () => {
    expect(
      getScheduledBlockCategoryPresentation(
        { taskId: 'missing' } as ScheduledBlock,
        [],
      ).label,
    ).toBe('其他')
  })
})
