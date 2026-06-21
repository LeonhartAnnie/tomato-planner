import { describe, expect, it } from 'vitest'
import type { Settings } from '../../types'
import { validateSettings } from './settingsRules'

const validSettings: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  calendarViewStartHour: 8,
  calendarViewEndHour: 22,
  defaultTaskDurationMinutes: 25,
}

describe('validateSettings', () => {
  it('throws when workMinutes is not positive', () => {
    expect(() => validateSettings({ ...validSettings, workMinutes: 0 })).toThrow()
  })

  it('throws when shortBreakMinutes is negative', () => {
    expect(() =>
      validateSettings({ ...validSettings, shortBreakMinutes: -1 }),
    ).toThrow()
  })

  it('throws when longBreakMinutes is negative', () => {
    expect(() =>
      validateSettings({ ...validSettings, longBreakMinutes: -1 }),
    ).toThrow()
  })

  it('throws when longBreakInterval is not positive', () => {
    expect(() =>
      validateSettings({ ...validSettings, longBreakInterval: 0 }),
    ).toThrow()
  })

  it('throws when calendar end hour is not after start hour', () => {
    expect(() =>
      validateSettings({
        ...validSettings,
        calendarViewStartHour: 18,
        calendarViewEndHour: 18,
      }),
    ).toThrow()
  })

  it('throws when calendar start hour is negative', () => {
    expect(() =>
      validateSettings({ ...validSettings, calendarViewStartHour: -1 }),
    ).toThrow()
  })

  it('throws when calendar end hour is greater than 24', () => {
    expect(() =>
      validateSettings({ ...validSettings, calendarViewEndHour: 25 }),
    ).toThrow()
  })

  it('throws when calendar hours are not finite', () => {
    expect(() =>
      validateSettings({
        ...validSettings,
        calendarViewStartHour: Number.NaN,
      }),
    ).toThrow()
    expect(() =>
      validateSettings({
        ...validSettings,
        calendarViewEndHour: Number.POSITIVE_INFINITY,
      }),
    ).toThrow()
  })

  it('accepts calendar hours within the valid range', () => {
    expect(() =>
      validateSettings({
        ...validSettings,
        calendarViewStartHour: 0,
        calendarViewEndHour: 24,
      }),
    ).not.toThrow()
  })

  it('throws when default task duration is not positive and finite', () => {
    expect(() =>
      validateSettings({
        ...validSettings,
        defaultTaskDurationMinutes: Number.NaN,
      }),
    ).toThrow()
    expect(() =>
      validateSettings({ ...validSettings, defaultTaskDurationMinutes: 0 }),
    ).toThrow()
  })

  it('does not throw for valid settings', () => {
    expect(() => validateSettings(validSettings)).not.toThrow()
  })
})
