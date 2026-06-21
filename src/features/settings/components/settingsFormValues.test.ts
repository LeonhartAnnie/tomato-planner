import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../../../domain/settings/defaultSettings'
import {
  settingsFormValuesToSettings,
  settingsToFormValues,
} from './settingsFormValues'

describe('settingsFormValues', () => {
  it('converts settings to string form values', () => {
    expect(settingsToFormValues(defaultSettings)).toMatchObject({
      workMinutes: '25',
      calendarViewEndHour: '22',
    })
  })

  it('converts form values to numbers in one place', () => {
    const values = settingsToFormValues(defaultSettings)
    expect(
      settingsFormValuesToSettings({ ...values, workMinutes: '50' }),
    ).toEqual({ ...defaultSettings, workMinutes: 50 })
  })

  it('converts an empty field to NaN for domain validation', () => {
    const values = settingsToFormValues(defaultSettings)
    expect(
      settingsFormValuesToSettings({ ...values, workMinutes: '' }).workMinutes,
    ).toBeNaN()
  })
})
