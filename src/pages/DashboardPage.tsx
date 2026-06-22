import { useEffect, useMemo, useState } from 'react'
import { isSameDay, parseISO } from 'date-fns'
import { Link } from 'react-router-dom'
import { OnboardingPanel } from '../features/onboarding/components/OnboardingPanel'
import type { OnboardingSnapshot } from '../features/onboarding/onboardingSelectors'
import {
  readOnboardingDismissed,
  writeOnboardingDismissed,
} from '../features/onboarding/onboardingStorage'
import { usePomodoroStore } from '../stores/pomodoroStore'
import { useScheduleStore } from '../stores/scheduleStore'
import { useSyncStore } from '../stores/syncStore'
import { useTaskStore } from '../stores/taskStore'

export function DashboardPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const loadTasks = useTaskStore((state) => state.loadTasks)
  const blocks = useScheduleStore((state) => state.blocks)
  const calendarEvents = useScheduleStore((state) => state.calendarEvents)
  const loadSchedule = useScheduleStore((state) => state.loadSchedule)
  const sessions = usePomodoroStore((state) => state.sessions)
  const loadSessions = usePomodoroStore((state) => state.loadSessions)
  const lastBackupUpdatedAt = useSyncStore(
    (state) => state.lastBackupUpdatedAt,
  )
  const cloudSummary = useSyncStore((state) => state.cloudSummary)
  const [dismissed, setDismissed] = useState(readOnboardingDismissed)

  useEffect(() => {
    void Promise.all([loadTasks(), loadSchedule(), loadSessions()])
  }, [loadSchedule, loadSessions, loadTasks])

  const todayScheduleCount = useMemo(
    () => blocks.filter((block) => isSameDay(parseISO(block.start), new Date())).length,
    [blocks],
  )

  const onboardingSnapshot: OnboardingSnapshot = {
    taskCount: tasks.length,
    scheduledBlockCount: blocks.length,
    pomodoroSessionCount: sessions.length,
    calendarEventCount: calendarEvents.length,
    hasDriveBackupStatus: Boolean(lastBackupUpdatedAt || cloudSummary),
  }

  const setGuideDismissed = (value: boolean) => {
    writeOnboardingDismissed(value)
    setDismissed(value)
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <h1>今日總覽</h1>
        <p>掌握任務、排程與專注紀錄，接著完成今天最重要的工作。</p>
      </div>

      <div className="dashboard-summary" aria-label="使用狀態摘要">
        <article><strong>{tasks.length}</strong><span>任務</span></article>
        <article><strong>{todayScheduleCount}</strong><span>今日排程</span></article>
        <article><strong>{sessions.length}</strong><span>番茄鐘紀錄</span></article>
        <article><strong>{calendarEvents.length}</strong><span>外部行程</span></article>
      </div>

      <OnboardingPanel
        snapshot={onboardingSnapshot}
        dismissed={dismissed}
        onDismiss={() => setGuideDismissed(true)}
        onRestore={() => setGuideDismissed(false)}
      />

      <nav className="dashboard-quick-links" aria-label="快速操作">
        <Link to="/tasks">管理任務</Link>
        <Link to="/schedule">查看排程</Link>
        <Link to="/pomodoro">開始專注</Link>
        <Link to="/settings">調整設定</Link>
      </nav>
    </section>
  )
}
