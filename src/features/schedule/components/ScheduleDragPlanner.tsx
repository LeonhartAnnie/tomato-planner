import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useMemo, useState, type FormEvent } from 'react'
import type { CreateScheduledBlockInput } from '../../../application/schedule/createScheduledBlock'
import type { CalendarEvent, ScheduledBlock, Task } from '../../../types'
import { toErrorMessage } from '../../../utils/error'
import {
  createDroppedTaskTimeRange,
  createRescheduledBlockTimeRange,
  getScheduledBlockDurationMinutes,
} from '../selectors/dragScheduleHelpers'
import {
  getNextSevenDays,
  groupScheduleItemsByDate,
  formatScheduleTimeRange,
} from '../selectors/scheduleDisplaySelectors'
import { DraggableTaskCard } from './DraggableTaskCard'
import { DroppableScheduleDay } from './DroppableScheduleDay'

interface ScheduleDragPlannerProps {
  tasks: Task[]
  blocks: ScheduledBlock[]
  calendarEvents: CalendarEvent[]
  defaultDurationMinutes: number
  isBusy: boolean
  error?: string | null
  onAdd: (input: CreateScheduledBlockInput) => Promise<boolean>
  onUpdate: (block: ScheduledBlock) => Promise<boolean>
  onDelete: (id: string) => void
}

type PendingDrop =
  | { type: 'create'; task: Task; targetDateKey: string }
  | {
      type: 'reschedule'
      block: ScheduledBlock
      targetDateKey: string
    }

type ActiveDragType = 'task' | 'scheduled-block'

export function ScheduleDragPlanner({
  tasks,
  blocks,
  calendarEvents,
  defaultDurationMinutes,
  isBusy,
  error,
  onAdd,
  onUpdate,
  onDelete,
}: ScheduleDragPlannerProps) {
  const [pendingDrop, setPendingDrop] = useState<PendingDrop>()
  const [startTime, setStartTime] = useState('09:00')
  const [formError, setFormError] = useState<string>()
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

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveDragType(undefined)
    const activeData = active.data.current
    const overData = over?.data.current
    if (
      overData?.type !== 'schedule-day' ||
      typeof overData.dateKey !== 'string'
    ) {
      return
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
        })
        setFormError(undefined)
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
        })
        setFormError(undefined)
      }
    }
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    const type = active.data.current?.type
    setActiveDragType(
      type === 'task' || type === 'scheduled-block' ? type : undefined,
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
        setPendingDrop(undefined)
        setStartTime('09:00')
        setFormError(undefined)
      }
    } catch (submitError: unknown) {
      setFormError(toErrorMessage(submitError))
    }
  }

  const cancelPendingDrop = () => {
    setPendingDrop(undefined)
    setStartTime('09:00')
    setFormError(undefined)
  }

  return (
    <section className="drag-planner" aria-labelledby="drag-planner-title">
      <h2 id="drag-planner-title">拖曳排程</h2>
      <p className="drag-planner-help">
        將未排程任務拖到日期建立排程，或拖曳既有排程重新安排日期。
      </p>

      <DndContext
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveDragType(undefined)}
        onDragEnd={handleDragEnd}
      >
        <div className="drag-planner-layout">
          <section className="draggable-task-panel" aria-label="未排程任務">
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
      </DndContext>

      {pendingDrop && (
        <form
          className="pending-drop-form"
          onSubmit={(event) => void handleSubmit(event)}
          aria-labelledby="pending-drop-title"
        >
          <h3 id="pending-drop-title">
            {pendingDrop.type === 'create'
              ? `將任務「${pendingDrop.task.title}」排到 ${pendingDrop.targetDateKey}`
              : `將排程「${pendingDrop.block.title}」重新排到 ${pendingDrop.targetDateKey}`}
          </h3>
          {pendingDrop.type === 'create' ? (
            <p className="pending-drop-summary">
              任務預估時間：{pendingDrop.task.estimatedMinutes} 分鐘
            </p>
          ) : (
            <div className="pending-drop-summary">
              <p>
                原本時間：
                {formatScheduleTimeRange(
                  pendingDrop.block.start,
                  pendingDrop.block.end,
                )}
              </p>
              <p>
                保留時間：
                {getScheduledBlockDurationMinutes(pendingDrop.block)} 分鐘
              </p>
            </div>
          )}
          <label>
            {pendingDrop.type === 'create' ? '開始時間' : '新的開始時間'}
            <input
              required
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>
          {(formError || error) && (
            <p className="pending-drop-error" role="alert">
              {formError ?? error}
            </p>
          )}
          <div className="pending-drop-actions">
            <button type="submit" disabled={isBusy}>
              {pendingDrop.type === 'create'
                ? '確認建立排程'
                : '確認重新排程'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={isBusy}
              onClick={cancelPendingDrop}
            >
              取消
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
