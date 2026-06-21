import type {
  PomodoroSession,
  PomodoroTimer,
  ScheduledBlock,
  Task,
} from '../../../types'

interface TaskReference {
  taskId?: string
}

interface ScheduledBlockReference {
  scheduledBlockId?: string
}

const findTask = (
  reference: TaskReference | undefined,
  tasks: Task[],
): Task | undefined =>
  reference?.taskId
    ? tasks.find((task) => task.id === reference.taskId)
    : undefined

const findScheduledBlock = (
  reference: ScheduledBlockReference | undefined,
  blocks: ScheduledBlock[],
): ScheduledBlock | undefined =>
  reference?.scheduledBlockId
    ? blocks.find((block) => block.id === reference.scheduledBlockId)
    : undefined

export const findTaskForTimer = (
  timer: PomodoroTimer | undefined,
  tasks: Task[],
): Task | undefined => findTask(timer, tasks)

export const findScheduledBlockForTimer = (
  timer: PomodoroTimer | undefined,
  blocks: ScheduledBlock[],
): ScheduledBlock | undefined => findScheduledBlock(timer, blocks)

export const findTaskForSession = (
  session: PomodoroSession,
  tasks: Task[],
): Task | undefined => findTask(session, tasks)

export const findScheduledBlockForSession = (
  session: PomodoroSession,
  blocks: ScheduledBlock[],
): ScheduledBlock | undefined => findScheduledBlock(session, blocks)
