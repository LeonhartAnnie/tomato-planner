import type { ReactNode } from 'react'
import type { ScheduledBlock } from '../../../types'
import { formatScheduleTimeRange } from '../selectors/scheduleDisplaySelectors'
import { getTaskCategoryPresentation } from '../../tasks/selectors/taskCategoryPresentation'
import { ScheduledBlockFocusControl } from './ScheduledBlockFocusControl'

interface ScheduleBlockListItemProps {
  block: ScheduledBlock
  isBusy: boolean
  onDelete: (id: string) => void
  isConflicting?: boolean
  conflictNotice?: ReactNode
  dragHandle?: ReactNode
  category?: string
}

export function ScheduleBlockListItem({
  block,
  isBusy,
  onDelete,
  isConflicting = false,
  conflictNotice,
  dragHandle,
  category,
}: ScheduleBlockListItemProps) {
  const categoryPresentation = getTaskCategoryPresentation(category)
  return (
    <li
      className={`schedule-block-item${
        isConflicting ? ' schedule-conflict-item' : ''
      }`}
    >
      <div>
        {dragHandle}
        <h3>{block.title}</h3>
        <span
          className={`task-category-badge ${categoryPresentation.cssClassName}`}
        >
          {categoryPresentation.label}
        </span>
        {conflictNotice}
        <dl className="schedule-block-details">
          <div>
            <dt>時間</dt>
            <dd>{formatScheduleTimeRange(block.start, block.end)}</dd>
          </div>
          <div>
            <dt>來源</dt>
            <dd>{block.source}</dd>
          </div>
          <div>
            <dt>Google 同步</dt>
            <dd>{block.syncedToGoogleCalendar ? '是' : '否'}</dd>
          </div>
        </dl>
      </div>
      <div className="schedule-block-actions">
        <ScheduledBlockFocusControl block={block} isBusy={isBusy} />
        <button
          type="button"
          className="danger"
          disabled={isBusy}
          onClick={() => onDelete(block.id)}
        >
          取消排程
        </button>
      </div>
    </li>
  )
}
