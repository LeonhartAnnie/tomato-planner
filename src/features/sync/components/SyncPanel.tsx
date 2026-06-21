import { useSyncStore } from '../../../stores/syncStore'

const statusLabels = {
  idle: '尚未操作',
  syncing: '處理中',
  success: '操作成功',
  error: '操作失敗',
} as const

const actionLabels = {
  upload: '上傳本機備份',
  restore: '從雲端還原',
} as const

const formatSyncedAt = (isoString: string): string =>
  new Intl.DateTimeFormat('zh-TW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoString))

export function SyncPanel() {
  const status = useSyncStore((state) => state.status)
  const error = useSyncStore((state) => state.error)
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt)
  const lastAction = useSyncStore((state) => state.lastAction)
  const lastBackupUpdatedAt = useSyncStore(
    (state) => state.lastBackupUpdatedAt,
  )
  const uploadLocalBackup = useSyncStore(
    (state) => state.uploadLocalBackup,
  )
  const restoreCloudBackup = useSyncStore(
    (state) => state.restoreCloudBackup,
  )
  const resetSyncState = useSyncStore((state) => state.resetSyncState)
  const isSyncing = status === 'syncing'
  const hasClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim())

  const handleUpload = () => {
    const confirmed = window.confirm(
      '這會用目前本機資料覆蓋 Google Drive 上的備份，是否繼續？',
    )
    if (confirmed) {
      void uploadLocalBackup()
    }
  }

  const handleRestore = () => {
    const confirmed = window.confirm(
      '這會用 Google Drive 備份覆蓋目前本機資料，是否繼續？',
    )
    if (confirmed) {
      void restoreCloudBackup()
    }
  }

  return (
    <section className="sync-panel" aria-labelledby="google-drive-sync-title">
      <h2 id="google-drive-sync-title">Google Drive 備份與還原</h2>

      <dl className="sync-status-details">
        <div>
          <dt>狀態</dt>
          <dd>
            <span className={`sync-status-badge sync-status-${status}`}>
              {statusLabels[status]}
            </span>
          </dd>
        </div>
        <div>
          <dt>上次操作</dt>
          <dd>{lastAction ? actionLabels[lastAction] : '尚無操作紀錄'}</dd>
        </div>
        <div>
          <dt>操作時間</dt>
          <dd>
            {lastSyncedAt ? formatSyncedAt(lastSyncedAt) : '尚無操作紀錄'}
          </dd>
        </div>
        <div>
          <dt>備份資料時間</dt>
          <dd>
            {lastBackupUpdatedAt
              ? formatSyncedAt(lastBackupUpdatedAt)
              : '尚無備份紀錄'}
          </dd>
        </div>
      </dl>

      {!hasClientId && (
        <p className="sync-config-warning">
          尚未設定 Google Client ID，Calendar 與 Drive 備份無法使用。
        </p>
      )}

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      <div className="sync-operation-list">
        <div className="sync-operation">
          <div>
            <h3>上傳本機備份</h3>
            <p>
              將目前這台裝置的任務、排程、設定與番茄鐘紀錄上傳到
              Google Drive，並覆蓋雲端備份。
            </p>
          </div>
          <button
            type="button"
            disabled={!hasClientId || isSyncing}
            onClick={handleUpload}
          >
            上傳本機備份
          </button>
        </div>
        <div className="sync-operation">
          <div>
            <h3>從雲端還原</h3>
            <p>
              從 Google Drive 下載備份，並覆蓋目前這台裝置的本機資料。
            </p>
          </div>
          <button
            type="button"
            className="secondary"
            disabled={!hasClientId || isSyncing}
            onClick={handleRestore}
          >
            從雲端還原
          </button>
        </div>
      </div>

      <div className="sync-panel-actions">
        <button
          type="button"
          className="secondary"
          disabled={isSyncing}
          onClick={resetSyncState}
        >
          重設狀態
        </button>
      </div>
    </section>
  )
}
