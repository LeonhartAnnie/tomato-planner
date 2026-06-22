import { useEffect } from 'react'
import type { ScheduledBlock } from '../../../types'
import type { TaskCategoryPresentation } from '../../tasks/selectors/taskCategoryPresentation'
import { formatScheduleTimeRange } from '../selectors/scheduleDisplaySelectors'
import { ScheduledBlockFocusControl } from './ScheduledBlockFocusControl'

interface TimeGridBlockActionsDialogProps {
  block: ScheduledBlock
  category: TaskCategoryPresentation
  isBusy: boolean
  onCancelSchedule: (id: string) => void
  onClose: () => void
}

export function TimeGridBlockActionsDialog({
  block,
  category,
  isBusy,
  onCancelSchedule,
  onClose,
}: TimeGridBlockActionsDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isBusy, onClose])

  const handleCancelSchedule = () => {
    onCancelSchedule(block.id)
    onClose()
  }

  return (
    <div className="schedule-dialog-overlay">
      <section
        className="time-grid-actions-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="time-grid-actions-dialog-title"
      >
        <h2 id="time-grid-actions-dialog-title">{block.title}</h2>
        <p>{formatScheduleTimeRange(block.start, block.end)}</p>
        <span className={`task-category-badge ${category.cssClassName}`}>
          {category.label}
        </span>
        <div className="time-grid-actions-dialog-buttons">
          <ScheduledBlockFocusControl block={block} isBusy={isBusy} />
          <button
            type="button"
            className="danger"
            disabled={isBusy}
            onClick={handleCancelSchedule}
          >
            取消排程
          </button>
          <button type="button" disabled={isBusy} onClick={onClose}>
            關閉
          </button>
        </div>
      </section>
    </div>
  )
}
