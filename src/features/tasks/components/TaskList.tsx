import type { Task } from '../../../types'
import { TaskListItem } from './TaskListItem'

interface TaskListProps {
  tasks: Task[]
  isBusy: boolean
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskList({
  tasks,
  isBusy,
  onEdit,
  onDelete,
}: TaskListProps) {
  return (
    <section className="task-list-section">
      <h2>任務列表</h2>
      {tasks.length === 0 ? (
        <p>尚無任務。</p>
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
