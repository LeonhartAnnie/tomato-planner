import type { ScheduleRepository } from './scheduleRepository'

export const deleteScheduledBlock = (
  id: string,
  repository: ScheduleRepository,
): Promise<void> => repository.deleteScheduledBlock(id)
