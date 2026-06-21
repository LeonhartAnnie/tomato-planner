import { useDroppable } from '@dnd-kit/core'
import type { ScheduleDisplayItem as ScheduleDisplayItemModel } from '../selectors/scheduleDisplaySelectors'
import { ScheduleDisplayItem } from './ScheduleDisplayItem'

interface DroppableScheduleDayProps {
  dateKey: string
  items: ScheduleDisplayItemModel[]
  isBusy: boolean
  isDropActive: boolean
  onDelete: (id: string) => void
}

export function DroppableScheduleDay({
  dateKey,
  items,
  isBusy,
  isDropActive,
  onDelete,
}: DroppableScheduleDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `schedule-day-${dateKey}`,
    disabled: isBusy,
    data: {
      type: 'schedule-day',
      dateKey,
    },
  })

  return (
    <section
      ref={setNodeRef}
      className={`droppable-schedule-day${
        isDropActive ? ' can-drop' : ''
      }${isOver ? ' is-over' : ''}`}
      aria-label={`${dateKey} 拖曳排程區`}
    >
      <h3>
        <time dateTime={dateKey}>{dateKey}</time>
      </h3>
      {items.length === 0 ? (
        <p className="empty-schedule-day">
          尚無排程，可拖曳任務到這裡
        </p>
      ) : (
        <ul className="schedule-block-list">
          {items.map((item) => (
            <ScheduleDisplayItem
              key={`${item.kind}-${item.id}`}
              item={item}
              isBusy={isBusy}
              onDelete={onDelete}
              isDraggable
            />
          ))}
        </ul>
      )}
    </section>
  )
}
