import { describe, expect, it } from 'vitest'
import { formatSeconds } from './timeFormat'

describe('formatSeconds', () => {
  it.each([
    [1500, '25:00'],
    [65, '01:05'],
    [5, '00:05'],
    [0, '00:00'],
    [-5, '00:00'],
  ])('formats %s seconds as %s', (seconds, expected) => {
    expect(formatSeconds(seconds)).toBe(expected)
  })
})
