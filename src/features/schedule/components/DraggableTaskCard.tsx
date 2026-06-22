import { useDraggable } from '@dnd-kit/core'
import type { Task } from '../../../types'
import { getTaskCategoryPresentation } from '../../tasks/selectors/taskCategoryPresentation'

interface DraggableTaskCardProps {
  task: Task
  disabled?: boolean
}

export function DraggableTaskCard({
  task,
  disabled = false,
}: DraggableTaskCardProps) {
  const category = getTaskCategoryPresentation(task.category)
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task-${task.id}`,
      disabled,
      data: {
        type: 'task',
        taskId: task.id,
      },
    })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <article
      ref={setNodeRef}
      className={`draggable-task-card ${category.cssClassName}${isDragging ? ' is-dragging' : ''}`}
      style={style}
      aria-label={`可排程任務：${task.title}`}
    >
      <strong>{task.title}</strong>
      <span className="task-category-badge">{category.label}</span>
      <span>預估 {task.estimatedMinutes} 分鐘</span>
      {task.location && <span>地點：{task.location}</span>}
      <span className="drag-item-hint">使用把手拖到時間格線</span>
      <button
        type="button"
        className="draggable-task-handle"
        disabled={disabled}
        aria-label={`拖曳任務「${task.title}」到時間格線`}
        {...listeners}
        {...attributes}
      >
        ⋮⋮ 拖曳
      </button>
    </article>
  )
}
