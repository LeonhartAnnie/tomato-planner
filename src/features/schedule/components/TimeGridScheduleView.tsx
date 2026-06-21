import type { CSSProperties } from 'react'
import type { CalendarEvent, ScheduledBlock } from '../../../types'
import {
  addConflictInfoToScheduleItems,
  createScheduleDisplayItems,
  getNextSevenDays,
  type ScheduleDisplayItem,
} from '../selectors/scheduleDisplaySelectors'
import {
  calculateTimeGridPosition,
  createHourlyTicks,
  formatDailySegmentTimeRange,
  splitEventIntoDailySegments,
  type TimeGridDailySegment,
} from '../selectors/scheduleTimeGridHelpers'

interface TimeGridScheduleViewProps {
  blocks: ScheduledBlock[]
  calendarEvents: CalendarEvent[]
  calendarViewStartHour: number
  calendarViewEndHour: number
}

interface TimeGridItemProps {
  item: ScheduleDisplayItem
  segment: TimeGridDailySegment
  calendarViewStartHour: number
  calendarViewEndHour: number
}

const PIXELS_PER_HOUR = 64

function TimeGridItem({
  item,
  segment,
  calendarViewStartHour,
  calendarViewEndHour,
}: TimeGridItemProps) {
  const position = calculateTimeGridPosition(
    segment.segmentStart,
    segment.segmentEnd,
    calendarViewStartHour,
    calendarViewEndHour,
  )
  if (position.hidden) {
    return null
  }

  const timeRange = formatDailySegmentTimeRange(segment)
  const isExternal = item.kind === 'calendar_event'
  const isCrossDay =
    segment.continuesFromPreviousDay || segment.continuesIntoNextDay
  const ariaLabel = isExternal
    ? `外部行程，唯讀：${item.title}，${timeRange}`
    : `排程：${item.title}，${timeRange}`
  const style: CSSProperties = {
    top: `${position.topPercent}%`,
    height: `${position.heightPercent}%`,
  }

  return (
    <article
      className={`time-grid-event ${
        isExternal
          ? 'time-grid-calendar-event'
          : 'time-grid-scheduled-block'
      }${item.hasConflict ? ' has-conflict' : ''}`}
      style={style}
      aria-label={ariaLabel}
    >
      <strong>{item.title}</strong>
      <time>{timeRange}</time>
      {isCrossDay && <span>跨天</span>}
      {isExternal && <span>外部行程，唯讀</span>}
      {item.hasConflict && <span className="time-grid-conflict">時間衝突</span>}
    </article>
  )
}

export function TimeGridScheduleView({
  blocks,
  calendarEvents,
  calendarViewStartHour,
  calendarViewEndHour,
}: TimeGridScheduleViewProps) {
  const dateKeys = getNextSevenDays()
  const items = addConflictInfoToScheduleItems(
    createScheduleDisplayItems(blocks, calendarEvents),
  )
  const segmentedItemsByDate = new Map<
    string,
    Array<{ item: ScheduleDisplayItem; segment: TimeGridDailySegment }>
  >(dateKeys.map((dateKey) => [dateKey, []]))

  for (const item of items) {
    const segments = splitEventIntoDailySegments(
      item.start,
      item.end,
      dateKeys,
    )
    for (const segment of segments) {
      segmentedItemsByDate.get(segment.dateKey)?.push({ item, segment })
    }
  }

  for (const segmentedItems of segmentedItemsByDate.values()) {
    segmentedItems.sort(
      (first, second) =>
        new Date(first.segment.segmentStart).getTime() -
        new Date(second.segment.segmentStart).getTime(),
    )
  }
  const ticks = createHourlyTicks(
    calendarViewStartHour,
    calendarViewEndHour,
  )
  const gridHeight =
    (calendarViewEndHour - calendarViewStartHour) * PIXELS_PER_HOUR

  return (
    <section
      className="time-grid-schedule"
      aria-label="未來七天時間格線視圖"
    >
      <h2>時間格線視圖</h2>
      <div className="time-grid-scroll">
        <div className="time-grid-frame">
          <div className="time-grid-header" aria-hidden="true">
            <div className="time-grid-corner">時間</div>
            {dateKeys.map((dateKey) => (
              <div className="time-grid-day-heading" key={dateKey}>
                <time dateTime={dateKey}>{dateKey}</time>
              </div>
            ))}
          </div>

          <div className="time-grid-body">
            <div className="time-grid-axis" style={{ height: gridHeight }}>
              {ticks.map((tick, index) => (
                <time
                  className={`time-grid-time-label${
                    index === 0 ? ' is-first' : ''
                  }${index === ticks.length - 1 ? ' is-last' : ''}`}
                  key={tick.hour}
                  style={{ top: `${tick.offsetPercent}%` }}
                >
                  {tick.label}
                </time>
              ))}
            </div>

            <div className="time-grid-days">
              {dateKeys.map((dateKey) => (
                <div
                  className="time-grid-day-column"
                  key={dateKey}
                  style={{ height: gridHeight }}
                  aria-label={`${dateKey} 排程`}
                >
                  {ticks.map((tick) => (
                    <span
                      aria-hidden="true"
                      className="time-grid-line"
                      key={tick.hour}
                      style={{ top: `${tick.offsetPercent}%` }}
                    />
                  ))}
                  {(segmentedItemsByDate.get(dateKey) ?? []).map(
                    ({ item, segment }) => (
                    <TimeGridItem
                      key={`${item.kind}-${item.id}-${segment.dateKey}`}
                      item={item}
                      segment={segment}
                      calendarViewStartHour={calendarViewStartHour}
                      calendarViewEndHour={calendarViewEndHour}
                    />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
