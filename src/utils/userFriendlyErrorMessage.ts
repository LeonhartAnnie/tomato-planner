export type UserErrorContext =
  | 'generic'
  | 'google-drive-read'
  | 'google-drive-write'
  | 'google-calendar'

const FALLBACK_MESSAGE = '操作失敗，請稍後再試。'

const getRawMessage = (error: unknown): string | undefined => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return undefined
}

const includesAny = (message: string, patterns: string[]): boolean =>
  patterns.some((pattern) => message.includes(pattern))

export const toUserFriendlyErrorMessage = (
  error: unknown,
  context: UserErrorContext = 'generic',
): string => {
  const rawMessage = getRawMessage(error)
  if (!rawMessage?.trim()) return FALLBACK_MESSAGE

  const message = rawMessage.toLowerCase()

  if (includesAny(message, ['failed to open popup window', 'popup_failed_to_open'])) {
    return 'Google 授權視窗被瀏覽器阻擋。請允許此網站開啟彈出視窗後再試一次。'
  }

  if (includesAny(message, [
    'access_denied', 'user_cancel', 'popup_closed', 'cancelled authorization',
  ])) {
    return '你已取消 Google 授權，因此操作沒有完成。'
  }

  if (includesAny(message, ['no google drive backup found', 'no cloud backup'])) {
    return '目前沒有雲端備份可還原。請先上傳本機備份。'
  }

  if (includesAny(message, [
    'invalid cloud backup', 'invalid cloudbackupdata',
    'cloud backup must be', 'cloud backup version',
    'unsupported cloud backup version', 'json parse',
  ])) {
    return '雲端備份格式無效，無法還原。請確認備份來源是否正確。'
  }

  if (includesAny(message, [
    'failed to fetch', 'networkerror', 'network error', 'fetch failed',
  ])) {
    return '網路連線失敗，請確認網路狀態後再試一次。'
  }

  if (includesAny(message, [
    'scheduled block conflicts', 'schedule conflict', 'overlap conflict',
  ])) {
    return '此排程與既有行程重疊，請選擇其他時間。'
  }

  if (context === 'google-calendar') {
    return '無法匯入 Google Calendar 行程，請確認授權與網路狀態。'
  }
  if (context === 'google-drive-read') {
    return '無法讀取 Google Drive 備份，請稍後再試。'
  }
  if (context === 'google-drive-write') {
    return '無法寫入 Google Drive 備份，請確認網路狀態與 Google 授權後再試。'
  }

  const domainMessages: Array<[string, string]> = [
    ['此排程尚未開始', '此排程尚未開始，請等到排程時間內再開始專注。'],
    ['此排程已結束', '此排程已結束，無法開始專注。'],
    ['此排程時間無效', '此排程時間無效，無法開始專注。'],
    ['task title is required', '請輸入任務名稱。'],
    ['estimated minutes must be', '預估時間必須是大於 0 的有效數字。'],
    ['end time must be after start time', '結束時間必須晚於開始時間。'],
    ['invalid date-time', '日期或時間格式無效，請重新輸入。'],
    ['workminutes must be greater than zero', '專注分鐘數必須大於 0。'],
    ['shortbreakminutes cannot be negative', '短休息分鐘數不可小於 0。'],
    ['longbreakminutes cannot be negative', '長休息分鐘數不可小於 0。'],
    ['longbreakinterval must be greater than zero', '長休息間隔必須大於 0。'],
    ['defaulttaskdurationminutes must be greater than zero', '預設任務時間必須大於 0。'],
    ['calendarviewstarthour cannot be negative', '行事曆開始小時不可小於 0。'],
    ['calendarviewendhour cannot be greater than 24', '行事曆結束小時不可大於 24。'],
    ['calendarviewendhour must be after', '行事曆結束時間必須晚於開始時間。'],
    ['must be a finite number', '設定值必須是有效數字。'],
    ['pomodoro duration must be', '番茄鐘時間必須是大於 0 的有效數字。'],
    ['no active pomodoro timer', '目前沒有進行中的番茄鐘。'],
    ['complete or clear the active timer', '請先完成目前的番茄鐘，再開始新的計時。'],
    ['no suggested pomodoro step', '目前沒有可開始的下一段番茄鐘。'],
    ['next suggested step is focus', '下一段建議是專注，不是休息。'],
    ['only a running pomodoro timer can be paused', '只有進行中的番茄鐘可以暫停。'],
    ['only a paused pomodoro timer can be resumed', '只有暫停中的番茄鐘可以繼續。'],
    ['paused pomodoro timer has no remaining time', '此番茄鐘已沒有剩餘時間。'],
  ]
  return domainMessages.find(([pattern]) => message.includes(pattern))?.[1]
    ?? FALLBACK_MESSAGE
}
