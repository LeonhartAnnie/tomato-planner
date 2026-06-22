import { describe, expect, it } from 'vitest'
import { toUserFriendlyErrorMessage } from './userFriendlyErrorMessage'

describe('toUserFriendlyErrorMessage', () => {
  it.each([
    ['Failed to fetch'],
    ['NetworkError when attempting to fetch resource'],
    ['fetch failed'],
  ])('maps network failures: %s', (message) => {
    expect(toUserFriendlyErrorMessage(new Error(message))).toBe(
      '網路連線失敗，請確認網路狀態後再試一次。',
    )
  })

  it('maps a blocked Google authorization popup', () => {
    expect(toUserFriendlyErrorMessage('Failed to open popup window')).toBe(
      'Google 授權視窗被瀏覽器阻擋。請允許此網站開啟彈出視窗後再試一次。',
    )
  })

  it.each(['access_denied', 'popup_closed_by_user', 'user_cancelled'])(
    'maps cancelled authorization: %s',
    (message) => {
      expect(toUserFriendlyErrorMessage(new Error(message))).toBe(
        '你已取消 Google 授權，因此操作沒有完成。',
      )
    },
  )

  it('maps a missing cloud backup', () => {
    expect(toUserFriendlyErrorMessage(new Error('No Google Drive backup found')))
      .toBe('目前沒有雲端備份可還原。請先上傳本機備份。')
  })

  it('maps Drive read and write errors by operation context', () => {
    expect(toUserFriendlyErrorMessage(
      new Error('Google API request failed (500)'), 'google-drive-read',
    )).toBe('無法讀取 Google Drive 備份，請稍後再試。')
    expect(toUserFriendlyErrorMessage(
      new Error('Google API request failed (500)'), 'google-drive-write',
    )).toBe('無法寫入 Google Drive 備份，請確認網路狀態與 Google 授權後再試。')
  })

  it('maps Google Calendar import errors by context', () => {
    expect(toUserFriendlyErrorMessage(
      new Error('Google Calendar request failed'), 'google-calendar',
    )).toBe('無法匯入 Google Calendar 行程，請確認授權與網路狀態。')
  })

  it.each([
    'Invalid cloud backup JSON',
    'Invalid CloudBackupData',
    'Unsupported cloud backup version: 2',
  ])('maps invalid backup data: %s', (message) => {
    expect(toUserFriendlyErrorMessage(new Error(message))).toBe(
      '雲端備份格式無效，無法還原。請確認備份來源是否正確。',
    )
  })

  it('maps schedule conflicts without exposing technical wording', () => {
    expect(toUserFriendlyErrorMessage(
      new Error('Scheduled block conflicts with an existing event'),
    )).toBe('此排程與既有行程重疊，請選擇其他時間。')
  })

  it.each([
    { value: new Error('Unknown internal detail'), label: 'Error object' },
    { value: 'Unknown internal detail', label: 'string error' },
    { value: { message: 'secret' }, label: 'unknown object' },
    { value: null, label: 'null' },
    { value: undefined, label: 'undefined' },
  ])('uses a safe fallback for $label', ({ value }) => {
    expect(toUserFriendlyErrorMessage(value)).toBe('操作失敗，請稍後再試。')
  })

  it('keeps known domain validation actionable', () => {
    expect(toUserFriendlyErrorMessage(new Error('Task title is required')))
      .toBe('請輸入任務名稱。')
  })
})
