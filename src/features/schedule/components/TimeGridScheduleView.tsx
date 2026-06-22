import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useState, type CSSProperties, type ReactNode } from 'react'
import type { CalendarEvent, ScheduledBlock, Task } from '../../../types'
import {
  getScheduledBlockCategoryPresentation,
  type TaskCategoryPresentation,
} from '../../tasks/selectors/taskCategoryPresentation'
import {
  addConflictInfoToScheduleItems,
  createScheduleDisplayItems,
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
import { ScheduledBlockFocusControl } from './ScheduledBlockFocusControl'
import {
  getTimeGridItemDisplayMode,
  shouldShowTimeGridInlineActions,
} from '../selectors/timeGridItemDisplay'
import { TimeGridBlockActionsDialog } from './TimeGridBlockActionsDialog'

interface TimeGridScheduleViewProps {
  blocks: ScheduledBlock[]
  calendarEvents: CalendarEvent[]
  calendarViewStartHour: number
  calendarViewEndHour: number
  isBusy: boolean
  isDropActive: boolean
  tasks: Task[]
  dateKeys: string[]
  onCancelBlock: (id: string) => void
}

interface TimeGridSegmentEntry {
  item: ScheduleDisplayItem
  segment: TimeGridDailySegment
  category?: TaskCategoryPresentation
}

interface TimeGridItemProps extends TimeGridSegmentEntry {
  calendarViewStartHour: number
  calendarViewEndHour: number
  isBusy: boolean
  onCancelBlock: (id: string) => void
  onOpenCompactActions: (
    block: ScheduledBlock,
    category: TaskCategoryPresentation,
  ) => void
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
  onCancelBlock: (id: string) => void
  onOpenCompactActions: (
    block: ScheduledBlock,
    category: TaskCategoryPresentation,
  ) => void
}

const PIXELS_PER_HOUR = 60

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
  category,
}: TimeGridSegmentEntry): ReactNode {
  const isExternal = item.kind === 'calendar_event'
  const isCrossDay =
    segment.continuesFromPreviousDay || segment.continuesIntoNextDay

  return (
    <div className="time-grid-event-content">
      <strong>{item.title}</strong>
      <time>{formatDailySegmentTimeRange(segment)}</time>
      {category && (
        <span className="task-category-badge">{category.label}</span>
      )}
      {isCrossDay && <span>跨天</span>}
      {isExternal && <span>Google Calendar 行程為唯讀</span>}
      {item.hasConflict && <span className="time-grid-conflict">時間衝突</span>}
    </div>
  )
}

function DraggableTimeGridBlock({
  item,
  segment,
  calendarViewStartHour,
  calendarViewEndHour,
  isBusy,
  category,
  onCancelBlock,
  onOpenCompactActions,
}: TimeGridItemProps) {
  if (item.kind !== 'scheduled_block') {
    return null
  }
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
  const displayMode = getTimeGridItemDisplayMode(
    segment.segmentStart,
    segment.segmentEnd,
  )
  const showInlineActions = shouldShowTimeGridInlineActions(
    item.kind,
    displayMode,
  )
  const resolvedCategory = category ?? {
    label: '其他',
    cssClassName: 'category-other',
  }
  const style: CSSProperties = {
    ...positionStyle,
    zIndex: isDragging ? 5 : positionStyle.zIndex,
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
  }

  return (
    <article
      ref={setNodeRef}
      className={`time-grid-event time-grid-scheduled-block time-grid-draggable-event is-${displayMode} ${resolvedCategory.cssClassName}${
        item.hasConflict ? ' has-conflict' : ''
      }${isDragging ? ' is-dragging' : ''}`}
      style={style}
      aria-label={`本機排程：${item.title}，${timeRange}`}
    >
      <button
        type="button"
        className="time-grid-drag-handle"
        disabled={isBusy}
        aria-label={`拖曳排程：${item.title}，${timeRange}`}
        {...listeners}
        {...attributes}
      >
        拖曳
      </button>
      <TimeGridEventContent
        item={item}
        segment={segment}
        category={resolvedCategory}
      />
      {showInlineActions ? (
        <div className="time-grid-event-actions">
          <ScheduledBlockFocusControl
            block={item.block}
            isBusy={isBusy}
            compact
          />
          <button
            type="button"
            className="time-grid-cancel-button"
            disabled={isBusy}
            aria-label={`取消排程：${item.title}`}
            onClick={() => onCancelBlock(item.id)}
          >
            取消排程
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="time-grid-compact-actions-button"
          disabled={isBusy}
          onClick={() => onOpenCompactActions(item.block, resolvedCategory)}
        >
          操作
        </button>
      )}
    </article>
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
  const displayMode = getTimeGridItemDisplayMode(
    segment.segmentStart,
    segment.segmentEnd,
  )
  return (
    <article
      className={`time-grid-event time-grid-calendar-event is-${displayMode}${
        item.hasConflict ? ' has-conflict' : ''
      }`}
      style={positionStyle}
      aria-label={`Google Calendar 行程為唯讀：${item.title}，${timeRange}`}
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
  onCancelBlock,
  onOpenCompactActions,
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
      {entries.map(({ item, segment, category }) => (
        <TimeGridItem
          key={`${item.kind}-${item.id}-${segment.dateKey}`}
          item={item}
          segment={segment}
          calendarViewStartHour={calendarViewStartHour}
          calendarViewEndHour={calendarViewEndHour}
          isBusy={isBusy}
          category={category}
          onCancelBlock={onCancelBlock}
          onOpenCompactActions={onOpenCompactActions}
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
  tasks,
  dateKeys,
  onCancelBlock,
}: TimeGridScheduleViewProps) {
  const [compactActions, setCompactActions] = useState<{
    block: ScheduledBlock
    category: TaskCategoryPresentation
  }>()
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
      segmentedItemsByDate.get(segment.dateKey)?.push({
        item,
        segment,
        category:
          item.kind === 'scheduled_block'
            ? getScheduledBlockCategoryPresentation(item.block, tasks)
            : undefined,
      })
    }
  }

  for (const segmentedItems of segmentedItemsByDate.values()) {
    segmentedItems.sort(
      (first, second) =>
        new Date(first.segment.segmentStart).getTime() -
        new Date(second.segment.segmentStart).getTime(),
    )
  }
  const hasVisibleItems = [...segmentedItemsByDate.values()].some(
    (entries) => entries.length > 0,
  )

  const ticks = createHourlyTicks(
    calendarViewStartHour,
    calendarViewEndHour,
  )
  const gridHeight =
    (calendarViewEndHour - calendarViewStartHour) * PIXELS_PER_HOUR

  return (
    <section
      className="time-grid-schedule"
      aria-label={`${dateKeys.length} 天時間格線視圖`}
    >
      <div className="time-grid-scroll">
        <div
          className="time-grid-frame"
          style={{
            '--time-grid-day-count': dateKeys.length,
            '--time-grid-min-width': `${70 + dateKeys.length * 140}px`,
          } as CSSProperties}
        >
          {!hasVisibleItems && (
            <p className="time-grid-empty-hint">
              把左側任務拖到時間格線，就能建立排程。
            </p>
          )}
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
                  onCancelBlock={onCancelBlock}
                  onOpenCompactActions={(block, category) =>
                    setCompactActions({ block, category })
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {compactActions && (
        <TimeGridBlockActionsDialog
          block={compactActions.block}
          category={compactActions.category}
          isBusy={isBusy}
          onCancelSchedule={onCancelBlock}
          onClose={() => setCompactActions(undefined)}
        />
      )}
    </section>
  )
}
