import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { CreateScheduledBlockInput } from '../application/schedule/createScheduledBlock'
import { ScheduleBlockForm } from '../features/schedule/components/ScheduleBlockForm'
import { GoogleCalendarPanel } from '../features/schedule/components/GoogleCalendarPanel'
import { ScheduleWeekView } from '../features/schedule/components/ScheduleWeekView'
import { createSampleCalendarEvents } from '../features/schedule/sampleCalendarEvents'
import { useScheduleStore } from '../stores/scheduleStore'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useTaskStore } from '../stores/taskStore'

export function SchedulePage() {
  const tasks = useTaskStore((state) => state.tasks)
  const tasksLoading = useTaskStore((state) => state.isLoading)
  const taskError = useTaskStore((state) => state.error)
  const loadTasks = useTaskStore((state) => state.loadTasks)
  const blocks = useScheduleStore((state) => state.blocks)
  const calendarEvents = useScheduleStore((state) => state.calendarEvents)
  const scheduleLoading = useScheduleStore((state) => state.isLoading)
  const scheduleError = useScheduleStore((state) => state.error)
  const loadSchedule = useScheduleStore((state) => state.loadSchedule)
  const addBlock = useScheduleStore((state) => state.addBlock)
  const deleteBlock = useScheduleStore((state) => state.deleteBlock)
  const setCalendarEvents = useScheduleStore(
    (state) => state.setCalendarEvents,
  )
  const pomodoroError = usePomodoroStore((state) => state.error)
  const isLoading = tasksLoading || scheduleLoading

  useEffect(() => {
    void loadTasks()
    void loadSchedule()
  }, [loadSchedule, loadTasks])

  const handleAdd = (input: CreateScheduledBlockInput) => addBlock(input)

  return (
    <section>
      <h1>排程</h1>
      {(taskError || scheduleError || pomodoroError) && (
        <p className="error-message">
          {taskError ?? scheduleError ?? pomodoroError}
        </p>
      )}
      {isLoading && <p role="status">處理中…</p>}
      {tasks.length === 0 && !tasksLoading && (
        <p>
          尚無可排程任務，請先前往 <Link to="/tasks">任務頁面</Link> 建立任務。
        </p>
      )}
      <GoogleCalendarPanel />
      {import.meta.env.DEV && (
        <div className="development-calendar-actions">
          <button
            type="button"
            className="sample-events-button"
            disabled={scheduleLoading}
            onClick={() =>
              void setCalendarEvents(createSampleCalendarEvents(blocks[0]))
            }
          >
            開發測試：載入範例外部行程
          </button>
        </div>
      )}

      <div className="schedule-layout">
        <ScheduleBlockForm
          tasks={tasks}
          isSubmitting={isLoading}
          onSubmit={handleAdd}
        />
        <ScheduleWeekView
          blocks={blocks}
          calendarEvents={calendarEvents}
          isBusy={isLoading}
          onDelete={(id) => void deleteBlock(id)}
        />
      </div>
    </section>
  )
}
