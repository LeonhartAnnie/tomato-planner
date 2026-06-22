import { normalizeTaskCategory } from '../../../domain/task/taskCategories'
import type { ScheduledBlock, Task } from '../../../types'

export interface TaskCategoryPresentation {
  label: string
  cssClassName: string
}

const categoryClassNames: Readonly<Record<string, string>> = {
  '工作': 'category-work',
  '學習': 'category-study',
  '生活': 'category-life',
  '健康': 'category-health',
  '其他': 'category-other',
}

export const getTaskCategoryPresentation = (
  category?: string,
): TaskCategoryPresentation => {
  const label = normalizeTaskCategory(category)
  return {
    label,
    cssClassName: categoryClassNames[label] ?? 'category-custom',
  }
}

export const getScheduledBlockCategoryPresentation = (
  block: ScheduledBlock,
  tasks: Task[],
): TaskCategoryPresentation =>
  getTaskCategoryPresentation(
    tasks.find((task) => task.id === block.taskId)?.category,
  )
