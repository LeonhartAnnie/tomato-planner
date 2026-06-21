import { useDraggable } from '@dnd-kit/core'
import type { ScheduledBlock } from '../../../types'
import { formatScheduleTimeRange } from '../selectors/scheduleDisplaySelectors'

interface DraggableScheduledBlockProps {
  block: ScheduledBlock
  disabled?: boolean
}

export function DraggableScheduledBlock({
  block,
  disabled = false,
}: DraggableScheduledBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `scheduled-block-${block.id}`,
      disabled,
      data: {
        type: 'scheduled-block',
        blockId: block.id,
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
      className={`draggable-scheduled-block${
        isDragging ? ' is-dragging' : ''
      }`}
      disabled={disabled}
      style={style}
      {...listeners}
      {...attributes}
    >
      <span>拖曳重新排程：{block.title}</span>
      <small>{formatScheduleTimeRange(block.start, block.end)}</small>
    </button>
  )
}
