import { describe, expect, it } from 'vitest'
import {
  createScheduleViewRange,
  shiftScheduleViewRange,
} from './scheduleViewRange'

const BASE_DATE = '2026-06-22T10:00:00+08:00'

describe('schedule view range', () => {
  it('creates a single day view', () => {
    const range = createScheduleViewRange('day', undefined, BASE_DATE)
    expect(range.dateKeys).toEqual(['2026-06-22'])
    expect(range.label).toBe('2026/06/22')
  })

  it('creates a three-day view and label', () => {
    const range = createScheduleViewRange('three-days', undefined, BASE_DATE)
    expect(range.dateKeys).toEqual([
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
    ])
    expect(range.label).toBe('2026/06/22 – 2026/06/24')
  })

  it('creates seven fixed days without navigation', () => {
    const range = createScheduleViewRange(
      'seven-days',
      '2026-06-25',
      BASE_DATE,
    )
    expect(range.dateKeys).toHaveLength(7)
    expect(range.anchorDateKey).toBe('2026-06-22')
    expect(range.label).toBe('2026/06/22 – 2026/06/28')
    expect(range.canGoPrevious).toBe(false)
    expect(range.canGoNext).toBe(false)
  })

  it('does not move day view before today', () => {
    const range = createScheduleViewRange('day', '2026-06-20', BASE_DATE)
    expect(range.anchorDateKey).toBe('2026-06-22')
    expect(shiftScheduleViewRange(range, -1, BASE_DATE).anchorDateKey)
      .toBe('2026-06-22')
  })

  it('does not move day view after the seventh day', () => {
    const range = createScheduleViewRange('day', '2026-06-30', BASE_DATE)
    expect(range.anchorDateKey).toBe('2026-06-28')
    expect(range.canGoNext).toBe(false)
  })

  it('allows the last three-day window from day five through day seven', () => {
    const range = createScheduleViewRange(
      'three-days',
      '2026-06-30',
      BASE_DATE,
    )
    expect(range.anchorDateKey).toBe('2026-06-26')
    expect(range.dateKeys).toEqual([
      '2026-06-26',
      '2026-06-27',
      '2026-06-28',
    ])
    expect(range.canGoNext).toBe(false)
  })

  it('clamps an out-of-range anchor after changing mode', () => {
    expect(
      createScheduleViewRange('three-days', '2026-06-28', BASE_DATE)
        .anchorDateKey,
    ).toBe('2026-06-26')
  })
})
