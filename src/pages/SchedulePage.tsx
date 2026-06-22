import { useEffect, useState } from 'react'
import type { CreateScheduledBlockInput } from '../application/schedule/createScheduledBlock'
import { GoogleCalendarPanel } from '../features/schedule/components/GoogleCalendarPanel'
import { ScheduleDragPlanner } from '../features/schedule/components/ScheduleDragPlanner'
import { createSampleCalendarEvents } from '../features/schedule/sampleCalendarEvents'
import { useScheduleStore } from '../stores/scheduleStore'
import { useSettingsStore } from '../stores/settingsStore'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useTaskStore } from '../stores/taskStore'
import {
  createScheduleViewRange,
  shiftScheduleViewRange,
  type ScheduleViewRangeMode,
} from '../features/schedule/selectors/scheduleViewRange'
import {
  readScheduleViewRangeMode,
  writeScheduleViewRangeMode,
} from '../features/schedule/selectors/scheduleViewRangeStorage'
import { nowIso } from '../utils/dateTime'

export function SchedulePage() {
  const [baseDateIso] = useState(nowIso)
  const [viewRange, setViewRange] = useState(() =>
    createScheduleViewRange(readScheduleViewRangeMode(), undefined, baseDateIso),
  )
  const tasks = useTaskStore((state) => state.tasks)
  const tasksLoading = useTaskStore((state) => state.isLoading)
  const taskError = useTaskStore((state) => state.error)
  const loadTasks = useTaskStore((state) => state.loadTasks)
  const addTask = useTaskStore((state) => state.addTask)
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
  const handleViewModeChange = (mode: ScheduleViewRangeMode) => {
    writeScheduleViewRangeMode(mode)
    setViewRange((current) =>
      createScheduleViewRange(mode, current.anchorDateKey, baseDateIso),
    )
  }

  return (
    <section className="schedule-page">
      <header className="schedule-page-heading">
        <h1>排程</h1>
      </header>
      {(taskError || scheduleError || settingsError || pomodoroError) && (
        <p className="error-message">
          {taskError ?? scheduleError ?? settingsError ?? pomodoroError}
        </p>
      )}
      {isLoading && <p role="status">處理中…</p>}
      <ScheduleDragPlanner
        tasks={tasks}
        blocks={blocks}
        calendarEvents={calendarEvents}
        defaultDurationMinutes={settings.defaultTaskDurationMinutes}
        calendarViewStartHour={settings.calendarViewStartHour}
        calendarViewEndHour={settings.calendarViewEndHour}
        isBusy={isLoading}
        error={scheduleError}
        onAdd={handleAdd}
        onUpdate={updateBlock}
        onDelete={deleteBlock}
        onAddTask={addTask}
        taskError={taskError}
        viewRange={viewRange}
        onViewModeChange={handleViewModeChange}
        onViewPrevious={() =>
          setViewRange((current) =>
            shiftScheduleViewRange(current, -1, baseDateIso),
          )
        }
        onViewNext={() =>
          setViewRange((current) =>
            shiftScheduleViewRange(current, 1, baseDateIso),
          )
        }
      />

      <section className="schedule-calendar-section" aria-label="Google Calendar 整合">
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
      </section>

    </section>
  )
}
