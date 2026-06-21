import { useCallback, useState } from 'react'
import { useSyncStore } from '../../../stores/syncStore'
import {
  BackupSafetyDialog,
  type BackupSafetyMode,
} from './BackupSafetyDialog'

const statusLabels = {
  idle: '尚未操作', syncing: '處理中', success: '操作成功', error: '操作失敗',
} as const

const actionLabels = {
  upload: '上傳本機備份', restore: '從雲端還原',
} as const

const formatSyncedAt = (isoString: string): string =>
  new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(isoString))

export function SyncPanel() {
  const status = useSyncStore((state) => state.status)
  const error = useSyncStore((state) => state.error)
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt)
  const lastAction = useSyncStore((state) => state.lastAction)
  const lastBackupUpdatedAt = useSyncStore((state) => state.lastBackupUpdatedAt)
  const localSummary = useSyncStore((state) => state.localSummary)
  const cloudSummary = useSyncStore((state) => state.cloudSummary)
  const summaryStatus = useSyncStore((state) => state.summaryStatus)
  const summaryError = useSyncStore((state) => state.summaryError)
  const loadLocalBackupSummary = useSyncStore(
    (state) => state.loadLocalBackupSummary,
  )
  const loadCloudBackupSummary = useSyncStore(
    (state) => state.loadCloudBackupSummary,
  )
  const uploadLocalBackup = useSyncStore((state) => state.uploadLocalBackup)
  const restoreCloudBackup = useSyncStore((state) => state.restoreCloudBackup)
  const resetSyncState = useSyncStore((state) => state.resetSyncState)
  const [dialogMode, setDialogMode] = useState<BackupSafetyMode>()
  const [preparationMessage, setPreparationMessage] = useState<string>()
  const isBusy = status === 'syncing' || summaryStatus === 'loading'
  const hasClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim())

  const prepareDialog = async (mode: BackupSafetyMode) => {
    setPreparationMessage(undefined)

    // Authorize cloud access at the beginning of the click handler so GIS can
    // still associate a possible popup with the user's gesture.
    const cloudLoaded = await loadCloudBackupSummary()
    if (!cloudLoaded) return

    if (mode === 'restore' && !useSyncStore.getState().cloudSummary) {
      setPreparationMessage('目前沒有雲端備份可還原。')
      return
    }

    const localLoaded = await loadLocalBackupSummary()
    if (!localLoaded) return
    setDialogMode(mode)
  }

  const handleConfirm = async () => {
    if (!dialogMode) return
    const succeeded = dialogMode === 'upload'
      ? await uploadLocalBackup()
      : await restoreCloudBackup()
    if (succeeded) setDialogMode(undefined)
  }

  const handleCancel = useCallback(() => setDialogMode(undefined), [])

  return (
    <section className="sync-panel" aria-labelledby="google-drive-sync-title">
      <h2 id="google-drive-sync-title">Google Drive 備份與還原</h2>

      <dl className="sync-status-details">
        <div><dt>狀態</dt><dd><span className={`sync-status-badge sync-status-${status}`}>{statusLabels[status]}</span></dd></div>
        <div><dt>上次操作</dt><dd>{lastAction ? actionLabels[lastAction] : '尚無操作紀錄'}</dd></div>
        <div><dt>操作時間</dt><dd>{lastSyncedAt ? formatSyncedAt(lastSyncedAt) : '尚無操作紀錄'}</dd></div>
        <div><dt>備份資料時間</dt><dd>{lastBackupUpdatedAt ? formatSyncedAt(lastBackupUpdatedAt) : '尚無備份紀錄'}</dd></div>
      </dl>

      {localSummary && (
        <p className="sync-summary-line">
          本機摘要：{localSummary.taskCount} 個任務、
          {localSummary.scheduledBlockCount} 個排程、
          {localSummary.pomodoroSessionCount} 筆番茄鐘紀錄
        </p>
      )}
      {cloudSummary && (
        <p className="sync-summary-line">
          雲端摘要：{cloudSummary.taskCount} 個任務、
          {cloudSummary.scheduledBlockCount} 個排程、
          {cloudSummary.pomodoroSessionCount} 筆番茄鐘紀錄
        </p>
      )}

      {!hasClientId && <p className="sync-config-warning">尚未設定 Google Client ID，Calendar 與 Drive 備份無法使用。</p>}
      {(summaryError || preparationMessage) && (
        <p className="error-message" role="alert">
          {summaryError ?? preparationMessage}
        </p>
      )}
      {error && !dialogMode && <p className="error-message" role="alert">{error}</p>}

      <div className="sync-operation-list">
        <div className="sync-operation">
          <div><h3>上傳本機備份</h3><p>先比較本機與雲端摘要，確認後以本機資料覆蓋雲端備份。</p></div>
          <button type="button" disabled={!hasClientId || isBusy} onClick={() => void prepareDialog('upload')}>上傳本機備份</button>
        </div>
        <div className="sync-operation">
          <div><h3>從雲端還原</h3><p>先比較雲端與本機摘要，確認後以雲端備份覆蓋本機資料。</p></div>
          <button type="button" className="secondary" disabled={!hasClientId || isBusy} onClick={() => void prepareDialog('restore')}>從雲端還原</button>
        </div>
      </div>

      <div className="sync-panel-actions">
        <button type="button" className="secondary" disabled={isBusy} onClick={resetSyncState}>重設狀態</button>
      </div>

      {dialogMode && localSummary && (
        <BackupSafetyDialog
          mode={dialogMode}
          localSummary={localSummary}
          cloudSummary={cloudSummary}
          isSubmitting={status === 'syncing'}
          error={error}
          onConfirm={() => void handleConfirm()}
          onCancel={handleCancel}
        />
      )}
    </section>
  )
}
