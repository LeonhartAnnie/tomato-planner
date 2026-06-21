import { useEffect, useState, type FormEvent } from 'react'
import type { Settings } from '../../../types'
import {
  settingsFormValuesToSettings,
  settingsToFormValues,
  type SettingsFormValues,
} from './settingsFormValues'

interface SettingsFormProps {
  settings: Settings
  isSubmitting: boolean
  error: string | null
  onSave: (settings: Settings) => Promise<boolean>
  onReset: () => Promise<boolean>
}

const fields: Array<{ key: keyof SettingsFormValues; label: string }> = [
  { key: 'workMinutes', label: '專注分鐘' },
  { key: 'shortBreakMinutes', label: '短休息分鐘' },
  { key: 'longBreakMinutes', label: '長休息分鐘' },
  { key: 'longBreakInterval', label: '長休息間隔' },
  { key: 'calendarViewStartHour', label: '日曆開始小時' },
  { key: 'calendarViewEndHour', label: '日曆結束小時' },
  { key: 'defaultTaskDurationMinutes', label: '預設任務分鐘' },
]

export function SettingsForm({
  settings,
  isSubmitting,
  error,
  onSave,
  onReset,
}: SettingsFormProps) {
  const [values, setValues] = useState(() => settingsToFormValues(settings))
  const [successMessage, setSuccessMessage] = useState<string>()

  useEffect(() => {
    setValues(settingsToFormValues(settings))
  }, [settings])

  const updateField = (key: keyof SettingsFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setSuccessMessage(undefined)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const succeeded = await onSave(settingsFormValuesToSettings(values))
    setSuccessMessage(succeeded ? '設定已儲存。' : undefined)
  }

  const handleReset = async () => {
    const succeeded = await onReset()
    setSuccessMessage(succeeded ? '已恢復預設設定。' : undefined)
  }

  return (
    <form
      className="settings-form"
      onSubmit={(event) => void handleSave(event)}
    >
      {fields.map(({ key, label }) => (
        <label key={key}>
          {label}
          <input
            type="number"
            value={values[key]}
            onChange={(event) => updateField(key, event.target.value)}
          />
        </label>
      ))}

      {error && <p className="error-message settings-feedback">{error}</p>}
      {successMessage && (
        <p className="success-message settings-feedback">{successMessage}</p>
      )}

      <div className="form-actions settings-actions">
        <button type="submit" disabled={isSubmitting}>
          Save
        </button>
        <button
          type="button"
          className="secondary"
          disabled={isSubmitting}
          onClick={() => void handleReset()}
        >
          Reset to Default
        </button>
      </div>
    </form>
  )
}
