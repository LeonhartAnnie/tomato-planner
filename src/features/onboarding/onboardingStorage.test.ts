import { beforeEach, describe, expect, it } from 'vitest'
import {
  ONBOARDING_DISMISSED_KEY,
  readOnboardingDismissed,
  writeOnboardingDismissed,
  type OnboardingStorage,
} from './onboardingStorage'

class MemoryStorage implements OnboardingStorage {
  private values = new Map<string, string>()
  getItem = (key: string) => this.values.get(key) ?? null
  setItem = (key: string, value: string) => { this.values.set(key, value) }
  removeItem = (key: string) => { this.values.delete(key) }
}

let storage: MemoryStorage

beforeEach(() => { storage = new MemoryStorage() })

describe('onboarding storage', () => {
  it('is not dismissed without the exact persisted value', () => {
    expect(readOnboardingDismissed(storage)).toBe(false)
    storage.setItem(ONBOARDING_DISMISSED_KEY, 'false')
    expect(readOnboardingDismissed(storage)).toBe(false)
  })

  it('persists dismissal without using app data storage', () => {
    writeOnboardingDismissed(true, storage)
    expect(readOnboardingDismissed(storage)).toBe(true)
  })

  it('removes dismissal when the guide is restored', () => {
    writeOnboardingDismissed(true, storage)
    writeOnboardingDismissed(false, storage)
    expect(readOnboardingDismissed(storage)).toBe(false)
  })

  it('falls back safely when browser storage is unavailable', () => {
    const unavailableStorage: OnboardingStorage = {
      getItem: () => { throw new Error('Storage unavailable') },
      setItem: () => { throw new Error('Storage unavailable') },
      removeItem: () => { throw new Error('Storage unavailable') },
    }
    expect(readOnboardingDismissed(unavailableStorage)).toBe(false)
    expect(() => writeOnboardingDismissed(true, unavailableStorage))
      .not.toThrow()
  })
})
