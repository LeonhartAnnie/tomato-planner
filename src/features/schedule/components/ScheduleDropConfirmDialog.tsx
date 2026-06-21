import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { ScheduledBlock, Task } from '../../../types'
import { formatDateTime } from '../../../utils/dateTime'
import { toErrorMessage } from '../../../utils/error'
import {
  createDroppedTaskTimeRange,
  createRescheduledBlockTimeRange,
  getScheduledBlockDurationMinutes,
} from '../selectors/dragScheduleHelpers'

export type ScheduleDropPending =
  | {
      type: 'create'
      task: Task
      targetDateKey: string
      initialTime: string
      source: 'schedule-day' | 'time-grid'
    }
  | {
      type: 'reschedule'
      block: ScheduledBlock
      targetDateKey: string
      initialTime: string
      source: 'schedule-day' | 'time-grid'
    }

interface ScheduleDropConfirmDialogProps {
  pending: ScheduleDropPending
  defaultDurationMinutes: number
  isSubmitting: boolean
  error?: string | null
  onConfirm: (startTime: string) => Promise<void>
  onCancel: () => void
}

interface SchedulePreview {
  end: string
  durationMinutes: number
}

export function ScheduleDropConfirmDialog({
  pending,
  defaultDurationMinutes,
  isSubmitting,
  error,
  onConfirm,
  onCancel,
}: ScheduleDropConfirmDialogProps) {
  const [startTime, setStartTime] = useState(pending.initialTime)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setStartTime(pending.initialTime)
  }, [pending])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSubmitting, onCancel])

  const preview = useMemo<
    { value?: SchedulePreview; error?: string }
  >(() => {
    try {
      const range =
        pending.type === 'create'
          ? createDroppedTaskTimeRange(
              pending.targetDateKey,
              startTime,
              pending.task,
              defaultDurationMinutes,
            )
          : createRescheduledBlockTimeRange(
              pending.block,
              pending.targetDateKey,
              startTime,
            )
      return {
        value: {
          end: range.end,
          durationMinutes: range.durationMinutes,
        },
      }
    } catch (previewError: unknown) {
      return { error: toErrorMessage(previewError) }
    }
  }, [defaultDurationMinutes, pending, startTime])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (preview.error) {
      return
    }
    await onConfirm(startTime)
  }

  const titleId = 'schedule-drop-dialog-title'

  return (
    <div className="schedule-dialog-overlay">
      <section
        className="schedule-drop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <form onSubmit={(event) => void handleSubmit(event)}>
          <h2 id={titleId}>
            {pending.type === 'create' ? '建立排程' : '重新排程'}
          </h2>

          <dl className="schedule-dialog-details">
            <div>
              <dt>{pending.type === 'create' ? '任務' : '排程'}</dt>
              <dd>
                {pending.type === 'create'
                  ? pending.task.title
                  : pending.block.title}
              </dd>
            </div>
            <div>
              <dt>目標日期</dt>
              <dd>{pending.targetDateKey}</dd>
            </div>
            {pending.type === 'create' ? (
              <div>
                <dt>預估時間</dt>
                <dd>{preview.value?.durationMinutes ?? '—'} 分鐘</dd>
              </div>
            ) : (
              <>
                <div>
                  <dt>原本時間</dt>
                  <dd>
                    {formatDateTime(pending.block.start)}–
                    {formatDateTime(pending.block.end)}
                  </dd>
                </div>
                <div>
                  <dt>保留時間</dt>
                  <dd>
                    {getScheduledBlockDurationMinutes(pending.block)} 分鐘
                  </dd>
                </div>
              </>
            )}
          </dl>

          {pending.source === 'time-grid' && (
            <p className="time-grid-prefill-note">
              {pending.type === 'create'
                ? '已根據時間格線預填開始時間。'
                : '已根據時間格線預填新的開始時間。'}
            </p>
          )}

          <label className="schedule-dialog-time-field">
            {pending.type === 'create' ? '開始時間' : '新的開始時間'}
            <input
              ref={inputRef}
              required
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>

          <p className="schedule-dialog-preview">
            {pending.type === 'create' ? '預計結束時間' : '新的結束時間'}：
            {preview.value ? formatDateTime(preview.value.end) : '—'}
          </p>

          {(preview.error || error) && (
            <p className="pending-drop-error" role="alert">
              {preview.error ?? error}
            </p>
          )}

          <div className="schedule-dialog-actions">
            <button type="submit" disabled={isSubmitting || !!preview.error}>
              {pending.type === 'create'
                ? '確認建立排程'
                : '確認重新排程'}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              取消
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
