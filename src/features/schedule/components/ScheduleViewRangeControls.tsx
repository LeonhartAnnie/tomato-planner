import type {
  ScheduleViewRange,
  ScheduleViewRangeMode,
} from '../selectors/scheduleViewRange'

interface ScheduleViewRangeControlsProps {
  range: ScheduleViewRange
  onModeChange: (mode: ScheduleViewRangeMode) => void
  onPrevious: () => void
  onNext: () => void
}

const modes: Array<{ mode: ScheduleViewRangeMode; label: string }> = [
  { mode: 'day', label: '今天' },
  { mode: 'three-days', label: '3 天' },
  { mode: 'seven-days', label: '7 天' },
]

export function ScheduleViewRangeControls({
  range,
  onModeChange,
  onPrevious,
  onNext,
}: ScheduleViewRangeControlsProps) {
  return (
    <header className="schedule-view-toolbar">
      <div>
        <h2>時間格線</h2>
        <div className="schedule-view-modes" aria-label="時間格線顯示範圍">
          {modes.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              className={range.mode === mode ? 'is-active' : undefined}
              aria-pressed={range.mode === mode}
              onClick={() => onModeChange(mode)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="schedule-view-navigation">
        {range.mode !== 'seven-days' && (
          <button
            type="button"
            disabled={!range.canGoPrevious}
            aria-label="顯示前一段日期"
            onClick={onPrevious}
          >
            ‹
          </button>
        )}
        <span aria-live="polite">{range.label}</span>
        {range.mode !== 'seven-days' && (
          <button
            type="button"
            disabled={!range.canGoNext}
            aria-label="顯示下一段日期"
            onClick={onNext}
          >
            ›
          </button>
        )}
      </div>
    </header>
  )
}
