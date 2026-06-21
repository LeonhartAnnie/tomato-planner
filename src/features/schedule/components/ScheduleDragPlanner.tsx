import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useEffect, useMemo, useState } from 'react'
import type { CreateScheduledBlockInput } from '../../../application/schedule/createScheduledBlock'
import type { CalendarEvent, ScheduledBlock, Task } from '../../../types'
import { toErrorMessage } from '../../../utils/error'
import {
  createDroppedTaskTimeRange,
  createRescheduledBlockTimeRange,
} from '../selectors/dragScheduleHelpers'
import {
  getNextSevenDays,
  groupScheduleItemsByDate,
} from '../selectors/scheduleDisplaySelectors'
import { calculateTimeFromGridDrop } from '../selectors/scheduleTimeGridHelpers'
import { DraggableTaskCard } from './DraggableTaskCard'
import { DroppableScheduleDay } from './DroppableScheduleDay'
import {
  ScheduleDropConfirmDialog,
  type ScheduleDropPending,
} from './ScheduleDropConfirmDialog'
import { TimeGridScheduleView } from './TimeGridScheduleView'

interface ScheduleDragPlannerProps {
  tasks: Task[]
  blocks: ScheduledBlock[]
  calendarEvents: CalendarEvent[]
  defaultDurationMinutes: number
  calendarViewStartHour: number
  calendarViewEndHour: number
  isBusy: boolean
  error?: string | null
  onAdd: (input: CreateScheduledBlockInput) => Promise<boolean>
  onUpdate: (block: ScheduledBlock) => Promise<boolean>
  onDelete: (id: string) => void
}

type ActiveDragType = 'task' | 'scheduled-block'

const getActivatorClientY = (event: Event): number | undefined => {
  if (event instanceof MouseEvent) {
    return event.clientY
  }
  if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
    return event.touches[0]?.clientY ?? event.changedTouches[0]?.clientY
  }
  return undefined
}

export function ScheduleDragPlanner({
  tasks,
  blocks,
  calendarEvents,
  defaultDurationMinutes,
  calendarViewStartHour,
  calendarViewEndHour,
  isBusy,
  error,
  onAdd,
  onUpdate,
  onDelete,
}: ScheduleDragPlannerProps) {
  const [pendingDrop, setPendingDrop] = useState<ScheduleDropPending>()
  const [formError, setFormError] = useState<string>()
  const [successMessage, setSuccessMessage] = useState<string>()
  const [showStoreError, setShowStoreError] = useState(false)
  const [activeDragType, setActiveDragType] = useState<ActiveDragType>()
  const dateKeys = useMemo(() => getNextSevenDays(), [])
  const dayGroups = groupScheduleItemsByDate(
    blocks,
    calendarEvents,
    dateKeys,
  )
  const scheduledTaskIds = new Set(blocks.map((block) => block.taskId))
  const unscheduledTasks = tasks.filter(
    (task) => !scheduledTaskIds.has(task.id),
  )

  useEffect(() => {
    if (!successMessage) {
      return
    }
    const timeoutId = window.setTimeout(() => setSuccessMessage(undefined), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [successMessage])

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragType(undefined)
    const { active, activatorEvent, delta, over } = event
    const activeData = active.data.current
    const overData = over?.data.current
    const isScheduleDay = overData?.type === 'schedule-day'
    const isTimeGridDay = overData?.type === 'time-grid-day'
    if (
      (!isScheduleDay && !isTimeGridDay) ||
      typeof overData?.dateKey !== 'string' ||
      !over
    ) {
      return
    }

    let nextStartTime = '09:00'
    if (isTimeGridDay) {
      try {
        const activatorClientY = getActivatorClientY(activatorEvent)
        const pointerY =
          activatorClientY === undefined
            ? over.rect.top + over.rect.height / 2
            : activatorClientY + delta.y
        nextStartTime = calculateTimeFromGridDrop({
          pointerY,
          gridTop: over.rect.top,
          gridHeight: over.rect.height,
          startHour: calendarViewStartHour,
          endHour: calendarViewEndHour,
          snapMinutes: 15,
        }).timeString
      } catch (dropError: unknown) {
        setFormError(toErrorMessage(dropError))
        return
      }
    }

    if (
      activeData?.type === 'task' &&
      typeof activeData.taskId === 'string'
    ) {
      const task = tasks.find((item) => item.id === activeData.taskId)
      if (task) {
        setPendingDrop({
          type: 'create',
          task,
          targetDateKey: overData.dateKey,
          initialTime: nextStartTime,
          source: isTimeGridDay ? 'time-grid' : 'schedule-day',
        })
        setFormError(undefined)
        setSuccessMessage(undefined)
        setShowStoreError(false)
      }
      return
    }

    if (
      activeData?.type === 'scheduled-block' &&
      typeof activeData.blockId === 'string'
    ) {
      const block = blocks.find((item) => item.id === activeData.blockId)
      if (block) {
        setPendingDrop({
          type: 'reschedule',
          block,
          targetDateKey: overData.dateKey,
          initialTime: nextStartTime,
          source: isTimeGridDay ? 'time-grid' : 'schedule-day',
        })
        setFormError(undefined)
        setSuccessMessage(undefined)
        setShowStoreError(false)
      }
    }
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const type = active.data.current?.type
    setActiveDragType(
      type === 'task' || type === 'scheduled-block' ? type : undefined,
    )
  }

  const handleConfirm = async (startTime: string) => {
    if (!pendingDrop) {
      return
    }

    try {
      let succeeded: boolean
      if (pendingDrop.type === 'create') {
        const { start, end } = createDroppedTaskTimeRange(
          pendingDrop.targetDateKey,
          startTime,
          pendingDrop.task,
          defaultDurationMinutes,
        )
        succeeded = await onAdd({
          taskId: pendingDrop.task.id,
          title: pendingDrop.task.title,
          start,
          end,
          source: 'manual',
          syncedToGoogleCalendar: false,
        })
      } else {
        const { start, end } = createRescheduledBlockTimeRange(
          pendingDrop.block,
          pendingDrop.targetDateKey,
          startTime,
        )
        succeeded = await onUpdate({
          ...pendingDrop.block,
          start,
          end,
        })
      }

      if (succeeded) {
        const message =
          pendingDrop.type === 'create'
            ? '已建立排程'
            : '已重新排程'
        setPendingDrop(undefined)
        setFormError(undefined)
        setSuccessMessage(message)
        setShowStoreError(false)
      } else {
        setShowStoreError(true)
      }
    } catch (submitError: unknown) {
      setFormError(toErrorMessage(submitError))
      setShowStoreError(false)
    }
  }

  const cancelPendingDrop = () => {
    setPendingDrop(undefined)
    setFormError(undefined)
    setShowStoreError(false)
  }

  return (
    <section className="schedule-dnd-workspace" aria-label="排程拖曳工作區">
      <DndContext
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveDragType(undefined)}
        onDragEnd={handleDragEnd}
      >
        <TimeGridScheduleView
          blocks={blocks}
          calendarEvents={calendarEvents}
          calendarViewStartHour={calendarViewStartHour}
          calendarViewEndHour={calendarViewEndHour}
          isBusy={isBusy}
          isDropActive={activeDragType !== undefined}
        />

        <details className="schedule-section" open>
          <summary>拖曳排程</summary>
          <div className="schedule-section-content">
            <section
              className="drag-planner"
              aria-labelledby="drag-planner-title"
            >
              <h2 id="drag-planner-title">拖曳排程</h2>
              <p className="drag-planner-help">
                可拖到日期後輸入時間，或直接拖到上方時間格線預填時間。
              </p>

              <div className="drag-planner-layout">
                <section
                  className="draggable-task-panel"
                  aria-label="未排程任務"
                >
                  <h3>未排程任務</h3>
                  {unscheduledTasks.length === 0 ? (
                    <p>目前沒有可拖曳的任務。</p>
                  ) : (
                    <div className="draggable-task-list">
                      {unscheduledTasks.map((task) => (
                        <DraggableTaskCard
                          key={task.id}
                          task={task}
                          disabled={isBusy}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <div className="droppable-day-list">
                  {dayGroups.map((group) => (
                    <DroppableScheduleDay
                      key={group.dateKey}
                      dateKey={group.dateKey}
                      items={group.items}
                      isBusy={isBusy}
                      isDropActive={activeDragType !== undefined}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </details>
      </DndContext>

      {successMessage && (
        <p className="schedule-success-message" role="status">
          {successMessage}
        </p>
      )}

      {pendingDrop && (
        <ScheduleDropConfirmDialog
          pending={pendingDrop}
          defaultDurationMinutes={defaultDurationMinutes}
          isSubmitting={isBusy}
          error={formError ?? (showStoreError ? error : undefined)}
          onConfirm={handleConfirm}
          onCancel={cancelPendingDrop}
        />
      )}
    </section>
  )
}
