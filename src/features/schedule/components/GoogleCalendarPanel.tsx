import { useScheduleStore } from '../../../stores/scheduleStore'
import { formatDateTime } from '../../../utils/dateTime'

const statusLabels = {
  idle: '尚未同步',
  importing: '同步中',
  success: '同步成功',
  error: '同步失敗',
} as const

export function GoogleCalendarPanel() {
  const calendarEventCount = useScheduleStore(
    (state) => state.calendarEvents.length,
  )
  const status = useScheduleStore((state) => state.googleCalendarStatus)
  const isLoading = useScheduleStore((state) => state.isLoading)
  const error = useScheduleStore((state) => state.googleCalendarError)
  const lastImportedAt = useScheduleStore(
    (state) => state.googleCalendarLastImportedAt,
  )
  const importGoogleCalendarEvents = useScheduleStore(
    (state) => state.importGoogleCalendarEvents,
  )
  const clearCalendarEvents = useScheduleStore(
    (state) => state.clearCalendarEvents,
  )
  const hasClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim())
  const isImporting = status === 'importing'

  return (
    <section className="google-calendar-panel" aria-labelledby="google-calendar-title">
      <div>
        <h2 id="google-calendar-title">Google Calendar</h2>
        <p className="google-calendar-view-note">
          目前匯入未來 7 天，時間格線會依目前視圖顯示對應日期。
        </p>
        <dl className="google-calendar-status">
          <div>
            <dt>狀態</dt>
            <dd>{statusLabels[status]}</dd>
          </div>
          <div>
            <dt>外部行程</dt>
            <dd>{calendarEventCount} 筆</dd>
          </div>
          <div>
            <dt>上次同步</dt>
            <dd>
              {lastImportedAt ? formatDateTime(lastImportedAt) : '尚無同步紀錄'}
            </dd>
          </div>
        </dl>
      </div>

      {!hasClientId && (
        <p className="calendar-config-warning">
          尚未設定 VITE_GOOGLE_CLIENT_ID，請先完成環境變數設定。
        </p>
      )}
      {error && <p className="error-message" role="alert">{error}</p>}

      <div className="calendar-import-actions">
        <button
          type="button"
          className="calendar-import-button"
          disabled={!hasClientId || isLoading}
          onClick={() => void importGoogleCalendarEvents()}
        >
          {isImporting
            ? '讀取中…'
            : lastImportedAt
              ? '重新同步'
              : '讀取 Google Calendar'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={isLoading || calendarEventCount === 0}
          onClick={() => void clearCalendarEvents()}
        >
          清除外部行程
        </button>
      </div>
    </section>
  )
}
