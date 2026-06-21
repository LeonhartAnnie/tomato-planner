import type { ScheduleDisplayItem as ScheduleDisplayItemModel } from '../selectors/scheduleDisplaySelectors'
import { formatScheduleTimeRange } from '../selectors/scheduleDisplaySelectors'
import { ScheduleBlockListItem } from './ScheduleBlockListItem'

interface ScheduleDisplayItemProps {
  item: ScheduleDisplayItemModel
  isBusy: boolean
  onDelete: (id: string) => void
}

function ConflictNotice({ item }: { item: ScheduleDisplayItemModel }) {
  if (!item.hasConflict) {
    return null
  }

  const description =
    item.conflicts.length === 1
      ? `與「${item.conflicts[0].title}」重疊`
      : `與 ${item.conflicts.length} 個項目重疊`

  return (
    <div className="schedule-conflict-notice">
      <span className="conflict-badge">時間衝突</span>
      <span>{description}</span>
    </div>
  )
}

export function ScheduleDisplayItem({
  item,
  isBusy,
  onDelete,
}: ScheduleDisplayItemProps) {
  if (item.kind === 'scheduled_block') {
    return (
      <ScheduleBlockListItem
        block={item.block}
        isBusy={isBusy}
        onDelete={onDelete}
        isConflicting={item.hasConflict}
        conflictNotice={<ConflictNotice item={item} />}
      />
    )
  }

  return (
    <li
      className={`schedule-block-item calendar-event-item${
        item.hasConflict ? ' schedule-conflict-item' : ''
      }`}
    >
      <div>
        <h3>{item.title}</h3>
        <ConflictNotice item={item} />
        <dl className="schedule-block-details">
          <div>
            <dt>時間</dt>
            <dd>{formatScheduleTimeRange(item.start, item.end)}</dd>
          </div>
          <div>
            <dt>來源</dt>
            <dd>Google Calendar／外部行程</dd>
          </div>
        </dl>
      </div>
      <span className="readonly-badge" aria-label="唯讀行程">
        Readonly
      </span>
    </li>
  )
}
