import { describe, expect, it } from 'vitest'
import { validateEstimatedMinutes, validateTaskTitle } from './taskRules'

describe('validateTaskTitle', () => {
  it('throws for an empty title', () => {
    expect(() => validateTaskTitle('')).toThrow()
  })

  it('throws for a whitespace-only title', () => {
    expect(() => validateTaskTitle('   ')).toThrow()
  })

  it('does not throw for a valid title', () => {
    expect(() => validateTaskTitle('完成專案規劃')).not.toThrow()
  })
})

describe('validateEstimatedMinutes', () => {
  it.each([0, -1])('throws when minutes are not positive: %s', (minutes) => {
    expect(() => validateEstimatedMinutes(minutes)).toThrow()
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'throws when minutes are not finite: %s',
    (minutes) => {
      expect(() => validateEstimatedMinutes(minutes)).toThrow()
    },
  )

  it('does not throw for valid estimated minutes', () => {
    expect(() => validateEstimatedMinutes(25)).not.toThrow()
  })
})
