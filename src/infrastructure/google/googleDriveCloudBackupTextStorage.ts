import type { CloudBackupTextStorage } from '../../application/sync/cloudBackupTextStorage'
import type { GoogleDriveTokenProvider } from './googleDriveAuth'
import {
  CLOUD_BACKUP_FILE_NAME,
  GOOGLE_DRIVE_APPDATA_SCOPE,
  type GoogleDriveFileDto,
  type GoogleDriveListResponseDto,
  type GoogleDriveUploadResponseDto,
} from './googleDriveTypes'
import type { GoogleHttpTransport } from './googleHttpTransport'

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files'
const DRIVE_UPLOAD_FILES_URL =
  'https://www.googleapis.com/upload/drive/v3/files'
const JSON_CONTENT_TYPE = 'application/json'

const escapeDriveQueryLiteral = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")

const buildListUrl = (fileName: string): string => {
  const query = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${escapeDriveQueryLiteral(fileName)}' and trashed = false`,
    fields: 'files(id,name)',
    pageSize: '1',
  })
  return `${DRIVE_FILES_URL}?${query.toString()}`
}

const buildDownloadUrl = (fileId: string): string =>
  `${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}?alt=media`

const buildCreateUrl = (): string =>
  `${DRIVE_UPLOAD_FILES_URL}?uploadType=multipart`

const buildUpdateUrl = (fileId: string): string =>
  `${DRIVE_UPLOAD_FILES_URL}/${encodeURIComponent(fileId)}?uploadType=media`

export class GoogleDriveCloudBackupTextStorage
  implements CloudBackupTextStorage
{
  constructor(
    private readonly tokenProvider: GoogleDriveTokenProvider,
    private readonly transport: GoogleHttpTransport,
    private readonly fileName = CLOUD_BACKUP_FILE_NAME,
  ) {}

  private findFile = async (
    accessToken: string,
  ): Promise<GoogleDriveFileDto | undefined> => {
    const response = await this.transport.getJson<GoogleDriveListResponseDto>(
      buildListUrl(this.fileName),
      accessToken,
    )
    return response.files?.[0]
  }

  readText = async (): Promise<string | undefined> => {
    const accessToken = await this.tokenProvider.getAccessToken(
      GOOGLE_DRIVE_APPDATA_SCOPE,
    )
    const file = await this.findFile(accessToken)
    return file
      ? this.transport.getText(buildDownloadUrl(file.id), accessToken)
      : undefined
  }

  writeText = async (text: string): Promise<void> => {
    const accessToken = await this.tokenProvider.getAccessToken(
      GOOGLE_DRIVE_APPDATA_SCOPE,
    )
    const file = await this.findFile(accessToken)

    if (file) {
      await this.transport.patchMedia<GoogleDriveUploadResponseDto>(
        buildUpdateUrl(file.id),
        accessToken,
        text,
        JSON_CONTENT_TYPE,
      )
      return
    }

    await this.transport.postMultipart<GoogleDriveUploadResponseDto>(
      buildCreateUrl(),
      accessToken,
      { name: this.fileName, parents: ['appDataFolder'] },
      text,
      JSON_CONTENT_TYPE,
    )
  }
}
