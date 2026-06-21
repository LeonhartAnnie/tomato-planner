import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePomodoroStore } from '../../../stores/pomodoroStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import type { ScheduledBlock } from '../../../types'
import { formatScheduleTimeRange } from '../selectors/scheduleDisplaySelectors'

interface ScheduleBlockListItemProps {
  block: ScheduledBlock
  isBusy: boolean
  onDelete: (id: string) => void
  isConflicting?: boolean
  conflictNotice?: ReactNode
}

export function ScheduleBlockListItem({
  block,
  isBusy,
  onDelete,
  isConflicting = false,
  conflictNotice,
}: ScheduleBlockListItemProps) {
  const navigate = useNavigate()
  const workMinutes = useSettingsStore((state) => state.settings.workMinutes)
  const startFocusForScheduledBlock = usePomodoroStore(
    (state) => state.startFocusForScheduledBlock,
  )

  const handleStartFocus = () => {
    if (startFocusForScheduledBlock(block, workMinutes)) {
      navigate('/pomodoro')
    }
  }

  return (
    <li
      className={`schedule-block-item${
        isConflicting ? ' schedule-conflict-item' : ''
      }`}
    >
      <div>
        <h3>{block.title}</h3>
        {conflictNotice}
        <dl className="schedule-block-details">
          <div>
            <dt>時間</dt>
            <dd>{formatScheduleTimeRange(block.start, block.end)}</dd>
          </div>
          <div>
            <dt>來源</dt>
            <dd>{block.source}</dd>
          </div>
          <div>
            <dt>Google 同步</dt>
            <dd>{block.syncedToGoogleCalendar ? '是' : '否'}</dd>
          </div>
        </dl>
      </div>
      <div className="schedule-block-actions">
        <button type="button" disabled={isBusy} onClick={handleStartFocus}>
          Start Focus
        </button>
        <button
          type="button"
          className="danger"
          disabled={isBusy}
          onClick={() => onDelete(block.id)}
        >
          Delete
        </button>
      </div>
    </li>
  )
}
