import { useEffect } from 'react'
import { SettingsForm } from '../features/settings/components/SettingsForm'
import { SyncPanel } from '../features/sync/components/SyncPanel'
import { useSettingsStore } from '../stores/settingsStore'
import type { Settings } from '../types'

export function SettingsPage() {
  const settings = useSettingsStore((state) => state.settings)
  const isLoading = useSettingsStore((state) => state.isLoading)
  const error = useSettingsStore((state) => state.error)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const resetSettings = useSettingsStore((state) => state.resetSettings)

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const handleSave = (nextSettings: Settings) =>
    updateSettings(nextSettings)

  return (
    <section>
      <h1>設定</h1>
      {isLoading && <p role="status">處理中…</p>}
      <SettingsForm
        settings={settings}
        isSubmitting={isLoading}
        error={error}
        onSave={handleSave}
        onReset={resetSettings}
      />
      <SyncPanel />
    </section>
  )
}
