import type { Task } from '../../../types'
import { TaskListItem } from './TaskListItem'
import { EmptyState } from '../../../components/EmptyState'

interface TaskListProps {
  tasks: Task[]
  isBusy: boolean
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onCreateFirstTask: () => void
}

export function TaskList({
  tasks,
  isBusy,
  onEdit,
  onDelete,
  onCreateFirstTask,
}: TaskListProps) {
  return (
    <section className="task-list-section">
      <h2>任務列表</h2>
      {tasks.length === 0 ? (
        <EmptyState
          title="還沒有任務"
          description="先建立一個任務，之後可以在排程頁把它拖到時間格線安排時間。"
          actionLabel="建立第一個任務"
          actionDisabled={isBusy}
          onAction={onCreateFirstTask}
        />
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              isBusy={isBusy}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
