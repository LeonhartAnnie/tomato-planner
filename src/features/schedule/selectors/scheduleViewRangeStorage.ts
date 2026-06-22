import type { ScheduleViewRangeMode } from './scheduleViewRange'

export const SCHEDULE_VIEW_RANGE_MODE_KEY = 'tomato:schedule:view-range-mode'

export interface ScheduleViewRangeStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const isScheduleViewRangeMode = (
  value: string | null,
): value is ScheduleViewRangeMode =>
  value === 'day' || value === 'three-days' || value === 'seven-days'

export const readScheduleViewRangeMode = (
  storage: ScheduleViewRangeStorage = localStorage,
): ScheduleViewRangeMode => {
  try {
    const value = storage.getItem(SCHEDULE_VIEW_RANGE_MODE_KEY)
    return isScheduleViewRangeMode(value) ? value : 'day'
  } catch {
    return 'day'
  }
}

export const writeScheduleViewRangeMode = (
  mode: ScheduleViewRangeMode,
  storage: ScheduleViewRangeStorage = localStorage,
): void => {
  try {
    storage.setItem(SCHEDULE_VIEW_RANGE_MODE_KEY, mode)
  } catch {
    // The in-memory selection remains usable when browser storage is unavailable.
  }
}
