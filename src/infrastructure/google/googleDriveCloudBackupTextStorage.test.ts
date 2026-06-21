import { describe, expect, it, vi } from 'vitest'
import type { GoogleDriveTokenProvider } from './googleDriveAuth'
import { GoogleDriveCloudBackupTextStorage } from './googleDriveCloudBackupTextStorage'
import {
  CLOUD_BACKUP_FILE_NAME,
  GOOGLE_DRIVE_APPDATA_SCOPE,
} from './googleDriveTypes'
import type { GoogleHttpTransport } from './googleHttpTransport'

const createDependencies = () => {
  const getAccessToken = vi.fn().mockResolvedValue('drive-token')
  const getJson = vi.fn()
  const getText = vi.fn()
  const postMultipart = vi.fn()
  const patchMedia = vi.fn()
  const tokenProvider: GoogleDriveTokenProvider = { getAccessToken }
  const transport: GoogleHttpTransport = {
    getJson: <T>(url: string, token: string) =>
      getJson(url, token) as Promise<T>,
    getText: (url, token) => getText(url, token) as Promise<string>,
    postMultipart: <T>(
      url: string,
      token: string,
      metadata: Record<string, unknown>,
      content: string,
      contentType: string,
    ) =>
      postMultipart(
        url,
        token,
        metadata,
        content,
        contentType,
      ) as Promise<T>,
    patchMedia: <T>(
      url: string,
      token: string,
      content: string,
      contentType: string,
    ) =>
      patchMedia(url, token, content, contentType) as Promise<T>,
  }
  return {
    tokenProvider,
    transport,
    getAccessToken,
    getJson,
    getText,
    postMultipart,
    patchMedia,
  }
}

describe('GoogleDriveCloudBackupTextStorage', () => {
  it('returns undefined when no appDataFolder file exists', async () => {
    const dependencies = createDependencies()
    dependencies.getJson.mockResolvedValue({ files: [] })
    const storage = new GoogleDriveCloudBackupTextStorage(
      dependencies.tokenProvider,
      dependencies.transport,
    )

    await expect(storage.readText()).resolves.toBeUndefined()
    const listUrl = new URL(dependencies.getJson.mock.calls[0][0] as string)
    expect(listUrl.searchParams.get('spaces')).toBe('appDataFolder')
    expect(listUrl.searchParams.get('q')).toBe(
      `name = '${CLOUD_BACKUP_FILE_NAME}' and trashed = false`,
    )
  })

  it('downloads text when the backup file exists', async () => {
    const dependencies = createDependencies()
    dependencies.getJson.mockResolvedValue({ files: [{ id: 'file-1' }] })
    dependencies.getText.mockResolvedValue('raw backup text')
    const storage = new GoogleDriveCloudBackupTextStorage(
      dependencies.tokenProvider,
      dependencies.transport,
    )

    await expect(storage.readText()).resolves.toBe('raw backup text')
    expect(dependencies.getText).toHaveBeenCalledWith(
      'https://www.googleapis.com/drive/v3/files/file-1?alt=media',
      'drive-token',
    )
  })

  it('creates a multipart appDataFolder file when none exists', async () => {
    const dependencies = createDependencies()
    dependencies.getJson.mockResolvedValue({ files: [] })
    dependencies.postMultipart.mockResolvedValue({ id: 'created-file' })
    const storage = new GoogleDriveCloudBackupTextStorage(
      dependencies.tokenProvider,
      dependencies.transport,
    )

    await storage.writeText('{"version":1}')

    expect(dependencies.postMultipart).toHaveBeenCalledWith(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      'drive-token',
      { name: CLOUD_BACKUP_FILE_NAME, parents: ['appDataFolder'] },
      '{"version":1}',
      'application/json',
    )
  })

  it('updates an existing file with a media upload', async () => {
    const dependencies = createDependencies()
    dependencies.getJson.mockResolvedValue({ files: [{ id: 'file-1' }] })
    dependencies.patchMedia.mockResolvedValue({ id: 'file-1' })
    const storage = new GoogleDriveCloudBackupTextStorage(
      dependencies.tokenProvider,
      dependencies.transport,
    )

    await storage.writeText('updated text')

    expect(dependencies.patchMedia).toHaveBeenCalledWith(
      'https://www.googleapis.com/upload/drive/v3/files/file-1?uploadType=media',
      'drive-token',
      'updated text',
      'application/json',
    )
    expect(dependencies.postMultipart).not.toHaveBeenCalled()
  })

  it('requests only the appDataFolder scope', async () => {
    const dependencies = createDependencies()
    dependencies.getJson.mockResolvedValue({ files: [] })
    const storage = new GoogleDriveCloudBackupTextStorage(
      dependencies.tokenProvider,
      dependencies.transport,
    )

    await storage.readText()

    expect(dependencies.getAccessToken).toHaveBeenCalledWith(
      GOOGLE_DRIVE_APPDATA_SCOPE,
    )
  })

  it('propagates transport errors', async () => {
    const dependencies = createDependencies()
    dependencies.getJson.mockRejectedValue(new Error('Drive unavailable'))
    const storage = new GoogleDriveCloudBackupTextStorage(
      dependencies.tokenProvider,
      dependencies.transport,
    )

    await expect(storage.readText()).rejects.toThrow('Drive unavailable')
  })

  it('returns raw text without parsing JSON', async () => {
    const dependencies = createDependencies()
    dependencies.getJson.mockResolvedValue({ files: [{ id: 'file-1' }] })
    dependencies.getText.mockResolvedValue('not-json')
    const storage = new GoogleDriveCloudBackupTextStorage(
      dependencies.tokenProvider,
      dependencies.transport,
    )

    await expect(storage.readText()).resolves.toBe('not-json')
  })
})
