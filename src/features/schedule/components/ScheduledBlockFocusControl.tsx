import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScheduledBlockFocusAvailability } from '../../../domain/schedule/scheduledBlockFocusRules'
import { usePomodoroStore } from '../../../stores/pomodoroStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import type { ScheduledBlock } from '../../../types'
import { nowIso } from '../../../utils/dateTime'

interface ScheduledBlockFocusControlProps {
  block: ScheduledBlock
  isBusy: boolean
  compact?: boolean
}

const unavailableMessages = {
  'not-started': '此排程尚未開始',
  ended: '此排程已結束',
  'invalid-time': '此排程時間無效',
} as const

export function ScheduledBlockFocusControl({
  block,
  isBusy,
  compact = false,
}: ScheduledBlockFocusControlProps) {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(nowIso)
  const workMinutes = useSettingsStore((state) => state.settings.workMinutes)
  const startFocusForScheduledBlock = usePomodoroStore(
    (state) => state.startFocusForScheduledBlock,
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(nowIso()), 30_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const availability = getScheduledBlockFocusAvailability(block, currentTime)
  const unavailableMessage = availability.canStart
    ? undefined
    : unavailableMessages[availability.reason]

  const handleStartFocus = () => {
    if (startFocusForScheduledBlock(block, workMinutes)) {
      navigate('/pomodoro')
    }
  }

  return (
    <div
      className={`scheduled-focus-control${compact ? ' is-compact' : ''}`}
    >
      <button
        type="button"
        disabled={isBusy || !availability.canStart}
        title={unavailableMessage}
        aria-label={unavailableMessage ?? `開始專注：${block.title}`}
        onClick={handleStartFocus}
      >
        Start Focus
      </button>
      {unavailableMessage && (
        <small className="focus-unavailable-reason">{unavailableMessage}</small>
      )}
    </div>
  )
}
