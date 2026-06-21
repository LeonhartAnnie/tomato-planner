import type { CalendarEvent, ScheduledBlock } from '../../../types'
import {
  getNextSevenDays,
  groupScheduleItemsByDate,
} from '../selectors/scheduleDisplaySelectors'
import { ScheduleDisplayItem } from './ScheduleDisplayItem'

interface ScheduleWeekViewProps {
  blocks: ScheduledBlock[]
  calendarEvents: CalendarEvent[]
  isBusy: boolean
  onDelete: (id: string) => void
}

export function ScheduleWeekView({
  blocks,
  calendarEvents,
  isBusy,
  onDelete,
}: ScheduleWeekViewProps) {
  const dateKeys = getNextSevenDays()
  const dayGroups = groupScheduleItemsByDate(blocks, calendarEvents, dateKeys)

  return (
    <section className="schedule-week" aria-label="未來七天排程">
      <h2>週排程清單</h2>
      <div className="schedule-days">
        {dayGroups.map((group) => (
          <section className="schedule-day" key={group.dateKey}>
            <h3>
              <time dateTime={group.dateKey}>{group.dateKey}</time>
            </h3>
            {group.items.length === 0 ? (
              <p className="empty-schedule-day">無排程</p>
            ) : (
              <ul className="schedule-block-list">
                {group.items.map((item) => (
                  <ScheduleDisplayItem
                    key={`${item.kind}-${item.id}`}
                    item={item}
                    isBusy={isBusy}
                    onDelete={onDelete}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </section>
  )
}
