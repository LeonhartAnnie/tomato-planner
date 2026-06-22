import { useEffect, useState } from 'react'
import {
  findScheduledBlockForTimer,
  findTaskForSession,
  findTaskForTimer,
} from '../features/pomodoro/selectors/pomodoroDisplaySelectors'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useScheduleStore } from '../stores/scheduleStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useTaskStore } from '../stores/taskStore'
import { formatDateTime } from '../utils/dateTime'
import { formatSeconds } from '../utils/timeFormat'

export function PomodoroPage() {
  const sessions = usePomodoroStore((state) => state.sessions)
  const activeTimer = usePomodoroStore((state) => state.activeTimer)
  const nextStep = usePomodoroStore((state) => state.nextStep)
  const error = usePomodoroStore((state) => state.error)
  const loadSessions = usePomodoroStore((state) => state.loadSessions)
  const startTimer = usePomodoroStore((state) => state.startTimer)
  const pauseTimer = usePomodoroStore((state) => state.pauseTimer)
  const resumeTimer = usePomodoroStore((state) => state.resumeTimer)
  const completeTimer = usePomodoroStore((state) => state.completeTimer)
  const startBreakFromNextStep = usePomodoroStore(
    (state) => state.startBreakFromNextStep,
  )
  const getRemainingSeconds = usePomodoroStore(
    (state) => state.getRemainingSeconds,
  )
  const settings = useSettingsStore((state) => state.settings)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const tasks = useTaskStore((state) => state.tasks)
  const loadTasks = useTaskStore((state) => state.loadTasks)
  const blocks = useScheduleStore((state) => state.blocks)
  const loadSchedule = useScheduleStore((state) => state.loadSchedule)
  const [, refresh] = useState(0)

  useEffect(() => {
    void loadSessions()
    void loadSettings()
    void loadTasks()
    void loadSchedule()
  }, [loadSchedule, loadSessions, loadSettings, loadTasks])

  useEffect(() => {
    if (activeTimer?.status !== 'running') {
      return
    }

    const intervalId = window.setInterval(() => refresh(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [activeTimer?.id, activeTimer?.status, activeTimer?.targetEndAt])

  const timerType = activeTimer?.type ?? 'focus'
  const timerStatus = activeTimer?.status ?? 'idle'
  const remainingTime = formatSeconds(getRemainingSeconds())
  const canPause = activeTimer?.status === 'running'
  const canResume = activeTimer?.status === 'paused'
  const canComplete = canPause || canResume
  const activeTask = findTaskForTimer(activeTimer, tasks)
  const activeBlock = findScheduledBlockForTimer(activeTimer, blocks)

  return (
    <section className="pomodoro-page">
      <h1>番茄鐘</h1>

      <div className="pomodoro-panel" aria-live="polite">
        <div className="timer-meta">
          <span>類型：{timerType}</span>
          <span>狀態：{timerStatus}</span>
        </div>
        <div className="timer-display">{remainingTime}</div>

        {!activeTimer && (
          <div className="pomodoro-idle-guidance">
            <strong>目前沒有進行中的專注</strong>
            <p>
              你可以從排程頁中目前正在進行的任務開始 Focus，系統會依照排程長度建立專注計時；也可以直接在這裡手動開始。
            </p>
          </div>
        )}

        {activeTimer && (
          <div className="timer-source">
            <p>
              任務：
              {activeTimer.taskId ? activeTask?.title ?? '未知任務' : '未指定任務'}
            </p>
            {activeTimer.scheduledBlockId && (
              <p>
                排程：
                {activeBlock
                  ? `${formatDateTime(activeBlock.start)} – ${formatDateTime(
                      activeBlock.end,
                    )}`
                  : '排程資訊不可用'}
              </p>
            )}
          </div>
        )}

        <div className="timer-actions">
          <button
            type="button"
            disabled={activeTimer !== undefined}
            onClick={() =>
              startTimer({
                type: 'focus',
                durationMinutes: settings.workMinutes,
              })
            }
          >
            Start Focus
          </button>
          <button type="button" disabled={!canPause} onClick={() => pauseTimer()}>
            Pause
          </button>
          <button
            type="button"
            disabled={!canResume}
            onClick={() => resumeTimer()}
          >
            Resume
          </button>
          <button
            type="button"
            disabled={!canComplete}
            onClick={() => void completeTimer()}
          >
            Complete
          </button>
        </div>

        {nextStep?.reason === 'after_focus' && (
          <div className="next-step-panel">
            <p>
              建議下一段：
              {nextStep.nextType === 'long_break' ? '長休息' : '短休息'}
            </p>
            <button type="button" onClick={() => startBreakFromNextStep()}>
              Start Break
            </button>
          </div>
        )}

        {nextStep?.reason === 'after_break' && (
          <div className="next-step-panel">
            <p>休息完成，可以開始下一輪專注。</p>
          </div>
        )}

        {error && <p className="error-message" role="alert">{error}</p>}
      </div>

      <div className="recent-sessions">
        <h2>最近完成</h2>
        {sessions.length === 0 ? (
          <p>尚無完成紀錄。</p>
        ) : (
          <ul>
            {[...sessions]
              .reverse()
              .slice(0, 5)
              .map((session) => {
                const sessionTask = findTaskForSession(session, tasks)
                return (
                  <li key={session.id}>
                    <div className="session-identity">
                      <span>{session.type}</span>
                      <strong>
                        {session.taskId
                          ? sessionTask?.title ?? '未知任務'
                          : '未指定任務'}
                      </strong>
                    </div>
                    <time dateTime={session.endedAt}>
                      {session.endedAt ? formatDateTime(session.endedAt) : '—'}
                    </time>
                  </li>
                )
              })}
          </ul>
        )}
      </div>
    </section>
  )
}
