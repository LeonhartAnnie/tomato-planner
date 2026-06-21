import { describe, expect, it } from 'vitest'
import { CloudBackupJsonRepository } from '../../application/sync/cloudBackupJsonRepository'
import type { CloudBackupData } from '../../application/sync/syncTypes'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { GoogleDriveTokenProvider } from './googleDriveAuth'
import { GoogleDriveCloudBackupTextStorage } from './googleDriveCloudBackupTextStorage'
import type { GoogleHttpTransport } from './googleHttpTransport'

class StatefulMockDriveTransport implements GoogleHttpTransport {
  private fileExists = false
  private text?: string

  constructor(initialText?: string) {
    this.fileExists = initialText !== undefined
    this.text = initialText
  }

  getJson = async <T>(): Promise<T> =>
    ({ files: this.fileExists ? [{ id: 'backup-file' }] : [] }) as unknown as T

  getText = async (): Promise<string> => this.text ?? ''

  postMultipart = async <T>(
    _url: string,
    _accessToken: string,
    _metadata: Record<string, unknown>,
    content: string,
  ): Promise<T> => {
    this.fileExists = true
    this.text = content
    return { id: 'backup-file' } as T
  }

  patchMedia = async <T>(
    _url: string,
    _accessToken: string,
    content: string,
  ): Promise<T> => {
    this.text = content
    return { id: 'backup-file' } as T
  }

  getStoredText = (): string | undefined => this.text
}

const tokenProvider: GoogleDriveTokenProvider = {
  getAccessToken: async () => 'mock-drive-token',
}

const backup: CloudBackupData = {
  version: 1,
  updatedAt: '2026-06-21T12:00:00.000Z',
  tasks: [],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
}

describe('Google Drive text storage JSON repository integration', () => {
  it('round-trips typed backup data through mock Drive string I/O', async () => {
    const transport = new StatefulMockDriveTransport()
    const textStorage = new GoogleDriveCloudBackupTextStorage(
      tokenProvider,
      transport,
    )
    const repository = new CloudBackupJsonRepository(textStorage)

    await repository.saveBackup(backup)

    expect(typeof transport.getStoredText()).toBe('string')
    await expect(repository.getBackup()).resolves.toEqual(backup)
  })

  it('lets the JSON repository reject invalid text returned by Drive storage', async () => {
    const transport = new StatefulMockDriveTransport('{invalid')
    const textStorage = new GoogleDriveCloudBackupTextStorage(
      tokenProvider,
      transport,
    )
    const repository = new CloudBackupJsonRepository(textStorage)

    await expect(repository.getBackup()).rejects.toThrow(
      'Invalid cloud backup JSON',
    )
  })

  it('stores no CalendarEvent or active timer fields', async () => {
    const transport = new StatefulMockDriveTransport()
    const repository = new CloudBackupJsonRepository(
      new GoogleDriveCloudBackupTextStorage(tokenProvider, transport),
    )

    await repository.saveBackup(backup)

    const storedValue = JSON.parse(transport.getStoredText() ?? '') as Record<
      string,
      unknown
    >
    expect(storedValue).not.toHaveProperty('calendarEvents')
    expect(storedValue).not.toHaveProperty('activeTimer')
  })
})
