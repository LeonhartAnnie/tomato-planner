export const ONBOARDING_DISMISSED_KEY = 'tomato:onboarding:dismissed'

export interface OnboardingStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const readOnboardingDismissed = (
  storage: OnboardingStorage = localStorage,
): boolean => {
  try {
    return storage.getItem(ONBOARDING_DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

export const writeOnboardingDismissed = (
  dismissed: boolean,
  storage: OnboardingStorage = localStorage,
): void => {
  try {
    if (dismissed) {
      storage.setItem(ONBOARDING_DISMISSED_KEY, 'true')
      return
    }
    storage.removeItem(ONBOARDING_DISMISSED_KEY)
  } catch {
    // Onboarding remains usable in memory when browser storage is unavailable.
  }
}
