import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { CSSProperties, ReactNode } from 'react'
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
  type TimeGridTick,
} from '../selectors/scheduleTimeGridHelpers'

interface TimeGridScheduleViewProps {
  blocks: ScheduledBlock[]
  calendarEvents: CalendarEvent[]
  calendarViewStartHour: number
  calendarViewEndHour: number
  isBusy: boolean
  isDropActive: boolean
}

interface TimeGridSegmentEntry {
  item: ScheduleDisplayItem
  segment: TimeGridDailySegment
}

interface TimeGridItemProps extends TimeGridSegmentEntry {
  calendarViewStartHour: number
  calendarViewEndHour: number
  isBusy: boolean
}

interface TimeGridDayColumnProps {
  dateKey: string
  entries: TimeGridSegmentEntry[]
  ticks: TimeGridTick[]
  gridHeight: number
  calendarViewStartHour: number
  calendarViewEndHour: number
  isBusy: boolean
  isDropActive: boolean
}

const PIXELS_PER_HOUR = 64

const getPositionStyle = (
  item: ScheduleDisplayItem,
  segment: TimeGridDailySegment,
  calendarViewStartHour: number,
  calendarViewEndHour: number,
): CSSProperties | undefined => {
  const position = calculateTimeGridPosition(
    segment.segmentStart,
    segment.segmentEnd,
    calendarViewStartHour,
    calendarViewEndHour,
  )
  if (position.hidden) {
    return undefined
  }

  return {
    top: `${position.topPercent}%`,
    height: `${position.heightPercent}%`,
    zIndex: item.kind === 'calendar_event' ? 1 : 2,
  }
}

function TimeGridEventContent({
  item,
  segment,
}: TimeGridSegmentEntry): ReactNode {
  const isExternal = item.kind === 'calendar_event'
  const isCrossDay =
    segment.continuesFromPreviousDay || segment.continuesIntoNextDay

  return (
    <>
      <strong>{item.title}</strong>
      <time>{formatDailySegmentTimeRange(segment)}</time>
      {isCrossDay && <span>跨天</span>}
      {isExternal && <span>外部行程，唯讀</span>}
      {item.hasConflict && <span className="time-grid-conflict">時間衝突</span>}
    </>
  )
}

function DraggableTimeGridBlock({
  item,
  segment,
  calendarViewStartHour,
  calendarViewEndHour,
  isBusy,
}: TimeGridItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `time-grid-scheduled-block-${item.id}-${segment.dateKey}`,
      disabled: isBusy,
      data: {
        type: 'scheduled-block',
        blockId: item.id,
      },
    })
  const positionStyle = getPositionStyle(
    item,
    segment,
    calendarViewStartHour,
    calendarViewEndHour,
  )
  if (!positionStyle) {
    return null
  }

  const timeRange = formatDailySegmentTimeRange(segment)
  const style: CSSProperties = {
    ...positionStyle,
    zIndex: isDragging ? 5 : positionStyle.zIndex,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`time-grid-event time-grid-scheduled-block time-grid-draggable-event${
        item.hasConflict ? ' has-conflict' : ''
      }${isDragging ? ' is-dragging' : ''}`}
      style={style}
      disabled={isBusy}
      aria-label={`拖曳排程：${item.title}，${timeRange}`}
      {...listeners}
      {...attributes}
    >
      <TimeGridEventContent item={item} segment={segment} />
    </button>
  )
}

function TimeGridItem(props: TimeGridItemProps) {
  const {
    item,
    segment,
    calendarViewStartHour,
    calendarViewEndHour,
  } = props
  if (item.kind === 'scheduled_block') {
    return <DraggableTimeGridBlock {...props} />
  }

  const positionStyle = getPositionStyle(
    item,
    segment,
    calendarViewStartHour,
    calendarViewEndHour,
  )
  if (!positionStyle) {
    return null
  }

  const timeRange = formatDailySegmentTimeRange(segment)
  return (
    <article
      className={`time-grid-event time-grid-calendar-event${
        item.hasConflict ? ' has-conflict' : ''
      }`}
      style={positionStyle}
      aria-label={`外部行程，唯讀：${item.title}，${timeRange}`}
    >
      <TimeGridEventContent item={item} segment={segment} />
    </article>
  )
}

function TimeGridDayColumn({
  dateKey,
  entries,
  ticks,
  gridHeight,
  calendarViewStartHour,
  calendarViewEndHour,
  isBusy,
  isDropActive,
}: TimeGridDayColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `time-grid-day-${dateKey}`,
    disabled: isBusy,
    data: {
      type: 'time-grid-day',
      dateKey,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`time-grid-day-column${
        isDropActive ? ' can-drop' : ''
      }${isOver ? ' is-over' : ''}`}
      style={{ height: gridHeight }}
      aria-label={`${dateKey} 時間格線拖曳區`}
    >
      {ticks.map((tick) => (
        <span
          aria-hidden="true"
          className="time-grid-line"
          key={tick.hour}
          style={{ top: `${tick.offsetPercent}%` }}
        />
      ))}
      {entries.map(({ item, segment }) => (
        <TimeGridItem
          key={`${item.kind}-${item.id}-${segment.dateKey}`}
          item={item}
          segment={segment}
          calendarViewStartHour={calendarViewStartHour}
          calendarViewEndHour={calendarViewEndHour}
          isBusy={isBusy}
        />
      ))}
    </div>
  )
}

export function TimeGridScheduleView({
  blocks,
  calendarEvents,
  calendarViewStartHour,
  calendarViewEndHour,
  isBusy,
  isDropActive,
}: TimeGridScheduleViewProps) {
  const dateKeys = getNextSevenDays()
  const items = addConflictInfoToScheduleItems(
    createScheduleDisplayItems(blocks, calendarEvents),
  )
  const segmentedItemsByDate = new Map<string, TimeGridSegmentEntry[]>(
    dateKeys.map((dateKey) => [dateKey, []]),
  )

  for (const item of items) {
    for (const segment of splitEventIntoDailySegments(
      item.start,
      item.end,
      dateKeys,
    )) {
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
      <p className="time-grid-help">
        將任務或既有排程拖到日期欄中的時間位置，確認後才會儲存。
      </p>
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
                <TimeGridDayColumn
                  key={dateKey}
                  dateKey={dateKey}
                  entries={segmentedItemsByDate.get(dateKey) ?? []}
                  ticks={ticks}
                  gridHeight={gridHeight}
                  calendarViewStartHour={calendarViewStartHour}
                  calendarViewEndHour={calendarViewEndHour}
                  isBusy={isBusy}
                  isDropActive={isDropActive}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
