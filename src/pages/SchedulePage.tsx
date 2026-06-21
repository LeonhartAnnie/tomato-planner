import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { CreateScheduledBlockInput } from '../application/schedule/createScheduledBlock'
import { ScheduleBlockForm } from '../features/schedule/components/ScheduleBlockForm'
import { GoogleCalendarPanel } from '../features/schedule/components/GoogleCalendarPanel'
import { ScheduleDragPlanner } from '../features/schedule/components/ScheduleDragPlanner'
import { ScheduleWeekView } from '../features/schedule/components/ScheduleWeekView'
import { TimeGridScheduleView } from '../features/schedule/components/TimeGridScheduleView'
import { createSampleCalendarEvents } from '../features/schedule/sampleCalendarEvents'
import { useScheduleStore } from '../stores/scheduleStore'
import { useSettingsStore } from '../stores/settingsStore'
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
  const updateBlock = useScheduleStore((state) => state.updateBlock)
  const deleteBlock = useScheduleStore((state) => state.deleteBlock)
  const setCalendarEvents = useScheduleStore(
    (state) => state.setCalendarEvents,
  )
  const pomodoroError = usePomodoroStore((state) => state.error)
  const settings = useSettingsStore((state) => state.settings)
  const settingsLoading = useSettingsStore((state) => state.isLoading)
  const settingsError = useSettingsStore((state) => state.error)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const isLoading = tasksLoading || scheduleLoading || settingsLoading

  useEffect(() => {
    void loadTasks()
    void loadSchedule()
    void loadSettings()
  }, [loadSchedule, loadSettings, loadTasks])

  const handleAdd = (input: CreateScheduledBlockInput) => addBlock(input)

  return (
    <section>
      <h1>排程</h1>
      {(taskError || scheduleError || settingsError || pomodoroError) && (
        <p className="error-message">
          {taskError ?? scheduleError ?? settingsError ?? pomodoroError}
        </p>
      )}
      {isLoading && <p role="status">處理中…</p>}
      {tasks.length === 0 && !tasksLoading && (
        <p>
          尚無可排程任務，請先前往 <Link to="/tasks">任務頁面</Link> 建立任務。
        </p>
      )}
      <TimeGridScheduleView
        blocks={blocks}
        calendarEvents={calendarEvents}
        calendarViewStartHour={settings.calendarViewStartHour}
        calendarViewEndHour={settings.calendarViewEndHour}
      />

      <details className="schedule-section" open>
        <summary>拖曳排程</summary>
        <div className="schedule-section-content">
          <ScheduleDragPlanner
            tasks={tasks}
            blocks={blocks}
            calendarEvents={calendarEvents}
            defaultDurationMinutes={settings.defaultTaskDurationMinutes}
            isBusy={isLoading}
            error={scheduleError}
            onAdd={handleAdd}
            onUpdate={updateBlock}
            onDelete={(id) => void deleteBlock(id)}
          />
        </div>
      </details>

      <div className="schedule-secondary-sections">
        <details className="schedule-section">
          <summary>手動建立排程</summary>
          <div className="schedule-section-content">
            <ScheduleBlockForm
              tasks={tasks}
              isSubmitting={isLoading}
              onSubmit={handleAdd}
            />
          </div>
        </details>

        <details className="schedule-section">
          <summary>週排程清單</summary>
          <div className="schedule-section-content">
            <ScheduleWeekView
              blocks={blocks}
              calendarEvents={calendarEvents}
              isBusy={isLoading}
              onDelete={(id) => void deleteBlock(id)}
            />
          </div>
        </details>

        <details className="schedule-section">
          <summary>Google Calendar</summary>
          <div className="schedule-section-content">
            <GoogleCalendarPanel />
            {import.meta.env.DEV && (
              <div className="development-calendar-actions">
                <button
                  type="button"
                  className="sample-events-button"
                  disabled={scheduleLoading}
                  onClick={() =>
                    void setCalendarEvents(
                      createSampleCalendarEvents(blocks[0]),
                    )
                  }
                >
                  開發測試：載入範例外部行程
                </button>
              </div>
            )}
          </div>
        </details>
      </div>
    </section>
  )
}
