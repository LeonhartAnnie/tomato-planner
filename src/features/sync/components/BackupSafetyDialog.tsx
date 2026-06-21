import { useEffect, useId, useRef } from 'react'
import type { BackupSummary } from '../../../application/sync/backupSummary'
import { formatDateTime } from '../../../utils/dateTime'

export type BackupSafetyMode = 'upload' | 'restore'

interface BackupSafetyDialogProps {
  mode: BackupSafetyMode
  localSummary: BackupSummary
  cloudSummary?: BackupSummary
  isSubmitting: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
}

interface SummaryCardProps {
  title: string
  summary: BackupSummary
  timeLabel: string
}

function SummaryCard({ title, summary, timeLabel }: SummaryCardProps) {
  return (
    <section className="backup-summary-card" aria-label={title}>
      <h3>{title}</h3>
      <dl>
        <div><dt>任務</dt><dd>{summary.taskCount}</dd></div>
        <div><dt>排程</dt><dd>{summary.scheduledBlockCount}</dd></div>
        <div><dt>番茄鐘紀錄</dt><dd>{summary.pomodoroSessionCount}</dd></div>
        <div><dt>設定</dt><dd>{summary.hasSettings ? '包含' : '不包含'}</dd></div>
        <div>
          <dt>{timeLabel}</dt>
          <dd>{formatDateTime(summary.latestDataUpdatedAt)}</dd>
        </div>
      </dl>
    </section>
  )
}

export function BackupSafetyDialog({
  mode,
  localSummary,
  cloudSummary,
  isSubmitting,
  error,
  onConfirm,
  onCancel,
}: BackupSafetyDialogProps) {
  const titleId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const isUpload = mode === 'upload'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isSubmitting, onCancel])

  return (
    <div className="backup-dialog-overlay">
      <section
        className="backup-safety-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header>
          <h2 id={titleId}>
            {isUpload ? '上傳本機備份' : '從雲端還原'}
          </h2>
          <p className="backup-overwrite-warning">
            {isUpload
              ? '這會用目前本機資料覆蓋 Google Drive 上的備份。'
              : '這會用 Google Drive 備份覆蓋目前本機資料。'}
          </p>
        </header>

        <div className="backup-summary-comparison">
          {isUpload ? (
            <>
              <SummaryCard
                title="準備上傳的本機資料"
                summary={localSummary}
                timeLabel="資料時間"
              />
              {cloudSummary ? (
                <SummaryCard
                  title="目前雲端備份"
                  summary={cloudSummary}
                  timeLabel="備份資料時間"
                />
              ) : (
                <p className="backup-empty-state">
                  目前沒有雲端備份，將建立新的備份。
                </p>
              )}
            </>
          ) : (
            <>
              {cloudSummary && (
                <SummaryCard
                  title="準備還原的雲端備份"
                  summary={cloudSummary}
                  timeLabel="備份資料時間"
                />
              )}
              <SummaryCard
                title="目前本機資料"
                summary={localSummary}
                timeLabel="資料時間"
              />
            </>
          )}
        </div>

        {error && <p className="backup-dialog-error" role="alert">{error}</p>}

        <div className="backup-dialog-actions">
          <button
            type="button"
            className="danger"
            disabled={isSubmitting}
            onClick={onConfirm}
          >
            {isSubmitting
              ? '處理中…'
              : isUpload
                ? '確認上傳並覆蓋雲端'
                : '確認還原並覆蓋本機'}
          </button>
          <button
            ref={cancelButtonRef}
            type="button"
            className="secondary"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            取消
          </button>
        </div>
      </section>
    </div>
  )
}
