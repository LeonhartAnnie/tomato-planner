import { beforeEach, describe, expect, it } from 'vitest'
import {
  readScheduleViewRangeMode,
  SCHEDULE_VIEW_RANGE_MODE_KEY,
  writeScheduleViewRangeMode,
  type ScheduleViewRangeStorage,
} from './scheduleViewRangeStorage'

class MemoryStorage implements ScheduleViewRangeStorage {
  private values = new Map<string, string>()
  getItem = (key: string) => this.values.get(key) ?? null
  setItem = (key: string, value: string) => { this.values.set(key, value) }
}

let storage: MemoryStorage

beforeEach(() => { storage = new MemoryStorage() })

describe('schedule view range storage', () => {
  it('defaults to day for missing or invalid values', () => {
    expect(readScheduleViewRangeMode(storage)).toBe('day')
    storage.setItem(SCHEDULE_VIEW_RANGE_MODE_KEY, 'month')
    expect(readScheduleViewRangeMode(storage)).toBe('day')
  })

  it('persists a supported mode', () => {
    writeScheduleViewRangeMode('three-days', storage)
    expect(readScheduleViewRangeMode(storage)).toBe('three-days')
  })

  it('falls back safely when storage is unavailable', () => {
    const unavailableStorage: ScheduleViewRangeStorage = {
      getItem: () => { throw new Error('Storage unavailable') },
      setItem: () => { throw new Error('Storage unavailable') },
    }
    expect(readScheduleViewRangeMode(unavailableStorage)).toBe('day')
    expect(() => writeScheduleViewRangeMode('seven-days', unavailableStorage))
      .not.toThrow()
  })
})
