import type { ScheduledBlock } from '../../../types'
import { ScheduleBlockListItem } from './ScheduleBlockListItem'

interface ScheduleBlockListProps {
  blocks: ScheduledBlock[]
  isBusy: boolean
  onDelete: (id: string) => void
}

export function ScheduleBlockList({
  blocks,
  isBusy,
  onDelete,
}: ScheduleBlockListProps) {
  return (
    <section className="schedule-list-section">
      <h2>已排程區塊</h2>
      {blocks.length === 0 ? (
        <p>尚無排程。</p>
      ) : (
        <ul className="schedule-block-list">
          {blocks.map((block) => (
            <ScheduleBlockListItem
              key={block.id}
              block={block}
              isBusy={isBusy}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
