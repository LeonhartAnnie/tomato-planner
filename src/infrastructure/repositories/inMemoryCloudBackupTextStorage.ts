import type { CloudBackupTextStorage } from '../../application/sync/cloudBackupTextStorage'

export class InMemoryCloudBackupTextStorage
  implements CloudBackupTextStorage
{
  private text?: string

  constructor(initialText?: string) {
    this.text = initialText
  }

  readText = async (): Promise<string | undefined> => this.text

  writeText = async (text: string): Promise<void> => {
    this.text = text
  }

  getStoredText = (): string | undefined => this.text
}
