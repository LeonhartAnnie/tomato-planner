import { describe, expect, it } from 'vitest'
import {
  getTimeGridItemDisplayMode,
  shouldShowTimeGridInlineActions,
} from './timeGridItemDisplay'

describe('timeGridItemDisplay', () => {
  it.each([
    ['2026-06-22T10:00:00.000Z', '2026-06-22T10:15:00.000Z'],
    ['2026-06-22T10:00:00.000Z', '2026-06-22T10:25:00.000Z'],
    ['2026-06-23T00:00:00.000Z', '2026-06-23T00:17:00.000Z'],
  ])('uses compact mode for a short segment', (start, end) => {
    expect(getTimeGridItemDisplayMode(start, end)).toBe('compact')
  })

  it('uses normal mode for a 60-minute segment', () => {
    expect(
      getTimeGridItemDisplayMode(
        '2026-06-22T10:00:00.000Z',
        '2026-06-22T11:00:00.000Z',
      ),
    ).toBe('normal')
  })

  it('shows inline actions only for normal scheduled blocks', () => {
    expect(shouldShowTimeGridInlineActions('scheduled_block', 'normal')).toBe(
      true,
    )
    expect(shouldShowTimeGridInlineActions('scheduled_block', 'compact')).toBe(
      false,
    )
    expect(shouldShowTimeGridInlineActions('calendar_event', 'normal')).toBe(
      false,
    )
  })

  it('rejects an invalid duration', () => {
    expect(() =>
      getTimeGridItemDisplayMode('invalid', '2026-06-22T11:00:00.000Z'),
    ).toThrow('valid positive duration')
  })
})
