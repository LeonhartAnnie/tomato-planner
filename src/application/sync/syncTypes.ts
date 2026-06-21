import type {
  PomodoroSession,
  ScheduledBlock,
  Settings,
  Task,
} from '../../types'

export type CloudBackupVersion = 1

export interface CloudBackupData {
  version: CloudBackupVersion
  updatedAt: string
  tasks: Task[]
  scheduledBlocks: ScheduledBlock[]
  settings: Settings
  pomodoroSessions: PomodoroSession[]
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface SyncState {
  status: SyncStatus
  error?: string
  lastSyncedAt?: string
  lastCloudUpdatedAt?: string
}

export interface SyncResult {
  used: 'local' | 'cloud'
  syncedAt: string
  cloudUpdatedAt?: string
}

export type SyncClock = () => string
