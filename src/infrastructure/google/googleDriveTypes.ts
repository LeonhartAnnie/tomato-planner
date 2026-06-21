export const GOOGLE_DRIVE_APPDATA_SCOPE =
  'https://www.googleapis.com/auth/drive.appdata'

export const CLOUD_BACKUP_FILE_NAME = 'tomato-planner-state.json'

export interface GoogleDriveFileDto {
  id: string
  name?: string
}

export interface GoogleDriveListResponseDto {
  files?: GoogleDriveFileDto[]
  nextPageToken?: string
}

export interface GoogleDriveUploadResponseDto {
  id: string
  name?: string
}
