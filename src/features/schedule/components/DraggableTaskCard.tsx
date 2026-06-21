import { useDraggable } from '@dnd-kit/core'
import type { Task } from '../../../types'

interface DraggableTaskCardProps {
  task: Task
  disabled?: boolean
}

export function DraggableTaskCard({
  task,
  disabled = false,
}: DraggableTaskCardProps) {
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
    <button
      ref={setNodeRef}
      type="button"
      className={`draggable-task-card${isDragging ? ' is-dragging' : ''}`}
      disabled={disabled}
      style={style}
      {...listeners}
      {...attributes}
      aria-label={`拖曳任務「${task.title}」到日期排程`}
    >
      <strong>{task.title}</strong>
      <span>預估 {task.estimatedMinutes} 分鐘</span>
      <span className="drag-item-hint">拖曳到日期排程</span>
    </button>
  )
}
