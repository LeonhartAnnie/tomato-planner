import { describe, expect, it } from 'vitest'
import { assertValidTimeRange, isOverlapping } from './scheduleRules'

describe('isOverlapping', () => {
  const baseStart = '2026-06-20T09:00:00.000Z'
  const baseEnd = '2026-06-20T10:00:00.000Z'

  it('returns true when time ranges completely overlap', () => {
    expect(
      isOverlapping(
        baseStart,
        baseEnd,
        '2026-06-20T08:00:00.000Z',
        '2026-06-20T11:00:00.000Z',
      ),
    ).toBe(true)
  })

  it('returns true when time ranges partially overlap', () => {
    expect(
      isOverlapping(
        baseStart,
        baseEnd,
        '2026-06-20T09:30:00.000Z',
        '2026-06-20T10:30:00.000Z',
      ),
    ).toBe(true)
  })

  it('returns false when A ends as B starts', () => {
    expect(
      isOverlapping(
        baseStart,
        baseEnd,
        baseEnd,
        '2026-06-20T11:00:00.000Z',
      ),
    ).toBe(false)
  })

  it('returns false when A starts as B ends', () => {
    expect(
      isOverlapping(
        baseStart,
        baseEnd,
        '2026-06-20T08:00:00.000Z',
        baseStart,
      ),
    ).toBe(false)
  })

  it('returns false when time ranges do not overlap', () => {
    expect(
      isOverlapping(
        baseStart,
        baseEnd,
        '2026-06-20T11:00:00.000Z',
        '2026-06-20T12:00:00.000Z',
      ),
    ).toBe(false)
  })
})

describe('assertValidTimeRange', () => {
  const start = '2026-06-20T09:00:00.000Z'

  it('does not throw when end is after start', () => {
    expect(() =>
      assertValidTimeRange(start, '2026-06-20T10:00:00.000Z'),
    ).not.toThrow()
  })

  it('throws when end equals start', () => {
    expect(() => assertValidTimeRange(start, start)).toThrow()
  })

  it('throws when end is before start', () => {
    expect(() =>
      assertValidTimeRange(start, '2026-06-20T08:00:00.000Z'),
    ).toThrow()
  })
})
