import type { CalendarEvent, ScheduledBlock } from '../../types'

export interface ScheduleRepository {
  getAllScheduledBlocks(): Promise<ScheduledBlock[]>
  addScheduledBlock(block: ScheduledBlock): Promise<void>
  updateScheduledBlock(block: ScheduledBlock): Promise<void>
  deleteScheduledBlock(id: string): Promise<void>
  getAllCalendarEvents(): Promise<CalendarEvent[]>
  setCalendarEvents(events: CalendarEvent[]): Promise<void>
}
