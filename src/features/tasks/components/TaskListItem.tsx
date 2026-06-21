import type { Task } from '../../../types'
import { formatDateTime } from '../../../utils/dateTime'

interface TaskListItemProps {
  task: Task
  isBusy: boolean
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskListItem({
  task,
  isBusy,
  onEdit,
  onDelete,
}: TaskListItemProps) {
  return (
    <li className="task-item">
      <div>
        <h3>{task.title}</h3>
        <dl className="task-details">
          <div>
            <dt>預估</dt>
            <dd>{task.estimatedMinutes} 分鐘</dd>
          </div>
          {task.category && (
            <div>
              <dt>分類</dt>
              <dd>{task.category}</dd>
            </div>
          )}
          {task.location && (
            <div>
              <dt>地點</dt>
              <dd>{task.location}</dd>
            </div>
          )}
          {task.deadline && (
            <div>
              <dt>截止</dt>
              <dd>{formatDateTime(task.deadline)}</dd>
            </div>
          )}
          <div>
            <dt>可拆分</dt>
            <dd>{task.splittable ? '是' : '否'}</dd>
          </div>
        </dl>
      </div>

      <div className="task-item-actions">
        <button type="button" disabled={isBusy} onClick={() => onEdit(task)}>
          Edit
        </button>
        <button
          type="button"
          className="danger"
          disabled={isBusy}
          onClick={() => onDelete(task.id)}
        >
          Delete
        </button>
      </div>
    </li>
  )
}
