import type { Task } from '../../../types'
import { getTaskCategoryPresentation } from '../selectors/taskCategoryPresentation'
import { getTaskDeadlineDisplay } from '../selectors/taskDeadlineDisplay'

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
  const category = getTaskCategoryPresentation(task.category)
  const deadline = getTaskDeadlineDisplay(task.deadline)

  return (
    <li className="task-item">
      <div>
        <h3>{task.title}</h3>
        <span className={`task-category-badge ${category.cssClassName}`}>
          {category.label}
        </span>
        <dl className="task-details">
          <div>
            <dt>預估</dt>
            <dd>{task.estimatedMinutes} 分鐘</dd>
          </div>
          {task.location && (
            <div>
              <dt>地點</dt>
              <dd>{task.location}</dd>
            </div>
          )}
          {deadline.kind !== 'none' && (
            <div>
              <dt>期限</dt>
              <dd>
                <span className={`task-deadline-badge is-${deadline.kind}`}>
                  {deadline.label}
                </span>
              </dd>
            </div>
          )}
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
