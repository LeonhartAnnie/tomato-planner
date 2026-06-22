import type { Task } from '../../../types'
import { DraggableTaskCard } from './DraggableTaskCard'

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
        <div className="schedule-task-tray-empty">
          <p>目前沒有可排程的任務。</p>
          <button type="button" disabled={isBusy} onClick={onAddTask}>
            ＋ 新增任務
          </button>
        </div>
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
