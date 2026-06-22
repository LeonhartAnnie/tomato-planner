import { describe, expect, it } from 'vitest'
import { getTaskDeadlineDisplay } from './taskDeadlineDisplay'

const NOW = '2026-06-23T10:00:00+08:00'

describe('task deadline display', () => {
  it('returns none without a deadline', () => {
    expect(getTaskDeadlineDisplay(undefined, NOW)).toEqual({
      kind: 'none',
      label: '',
    })
  })

  it('shows an upcoming deadline more than 24 hours away', () => {
    expect(
      getTaskDeadlineDisplay('2026-06-25T12:00:00+08:00', NOW).kind,
    ).toBe('upcoming')
  })

  it('shows a deadline later today as today', () => {
    expect(
      getTaskDeadlineDisplay('2026-06-23T18:30:00+08:00', NOW),
    ).toMatchObject({ kind: 'today', label: '今天截止 18:30' })
  })

  it('shows a next-day deadline within 24 hours as soon', () => {
    expect(
      getTaskDeadlineDisplay('2026-06-24T09:00:00+08:00', NOW).kind,
    ).toBe('soon')
  })

  it('shows a past deadline as overdue', () => {
    expect(
      getTaskDeadlineDisplay('2026-06-23T09:59:00+08:00', NOW).kind,
    ).toBe('overdue')
  })

  it('falls back safely for an invalid date', () => {
    expect(getTaskDeadlineDisplay('not-a-date', NOW)).toEqual({
      kind: 'none',
      label: '',
    })
  })
})
