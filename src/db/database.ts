import Dexie, { type EntityTable } from 'dexie'
import type {
  CalendarEvent,
  PomodoroSession,
  ScheduledBlock,
  SettingsRecord,
  Task,
} from '../types'

class TomatoDatabase extends Dexie {
  tasks!: EntityTable<Task, 'id'>
  scheduledBlocks!: EntityTable<ScheduledBlock, 'id'>
  calendarEvents!: EntityTable<CalendarEvent, 'id'>
  pomodoroSessions!: EntityTable<PomodoroSession, 'id'>
  settings!: EntityTable<SettingsRecord, 'id'>

  constructor() {
    super('TomatoPlannerDatabase')
    this.version(1).stores({
      tasks: 'id, title, deadline, createdAt, updatedAt',
      scheduledBlocks: 'id, taskId, start, end, source',
      calendarEvents: 'id, start, end',
      pomodoroSessions: 'id, taskId, scheduledBlockId, type, startedAt',
    })

    this.version(2).stores({
      tasks: 'id, title, deadline, createdAt, updatedAt',
      scheduledBlocks: 'id, taskId, start, end, source',
      calendarEvents: 'id, start, end',
      pomodoroSessions: 'id, taskId, scheduledBlockId, type, startedAt',
      settings: 'id',
    })
  }
}

export const db = new TomatoDatabase()
