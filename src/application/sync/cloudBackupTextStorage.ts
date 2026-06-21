export interface CloudBackupTextStorage {
  readText(): Promise<string | undefined>
  writeText(text: string): Promise<void>
}
