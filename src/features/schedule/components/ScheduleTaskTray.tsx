import type { Task } from '../../../types'
import { DraggableTaskCard } from './DraggableTaskCard'
import { EmptyState } from '../../../components/EmptyState'

interface ScheduleTaskTrayProps {
  tasks: Task[]
  isBusy: boolean
  onAddTask: () => void
}

export function ScheduleTaskTray({
  tasks,
  isBusy,
  onAddTask,
}: ScheduleTaskTrayProps) {
  return (
    <section className="schedule-task-tray" aria-labelledby="schedule-task-tray-title">
      <header className="schedule-task-tray-heading">
        <div>
          <h2 id="schedule-task-tray-title">可排程任務</h2>
          <p>將任務拖曳到時間格線中安排時間。</p>
        </div>
        <button type="button" disabled={isBusy} onClick={onAddTask}>
          ＋ 新增任務
        </button>
      </header>

      {tasks.length === 0 ? (
        <EmptyState
          compact
          title="沒有可排程任務"
          description="建立任務後，可以從這裡拖到右側時間格線。"
          actionLabel="＋ 新增任務"
          actionDisabled={isBusy}
          onAction={onAddTask}
        />
      ) : (
        <div className="schedule-task-tray-list">
          {tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              disabled={isBusy}
            />
          ))}
        </div>
      )}
    </section>
  )
}
