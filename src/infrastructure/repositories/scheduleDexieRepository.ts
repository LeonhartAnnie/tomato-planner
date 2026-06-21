import type { ScheduleRepository } from '../../application/schedule/scheduleRepository'
import { db } from '../../db'

export const scheduleDexieRepository: ScheduleRepository = {
  getAllScheduledBlocks: () => db.scheduledBlocks.toArray(),
  addScheduledBlock: async (block) => {
    await db.scheduledBlocks.add(block)
  },
  updateScheduledBlock: async (block) => {
    await db.scheduledBlocks.put(block)
  },
  deleteScheduledBlock: (id) => db.scheduledBlocks.delete(id),
  getAllCalendarEvents: () => db.calendarEvents.toArray(),
  setCalendarEvents: async (events) => {
    await db.transaction('rw', db.calendarEvents, async () => {
      await db.calendarEvents.clear()
      await db.calendarEvents.bulkPut(events)
    })
  },
}
