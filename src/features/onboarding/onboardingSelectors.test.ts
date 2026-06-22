import { describe, expect, it } from 'vitest'
import {
  getOnboardingSteps,
  isMainOnboardingComplete,
  type OnboardingSnapshot,
} from './onboardingSelectors'

const snapshot = (
  updates: Partial<OnboardingSnapshot> = {},
): OnboardingSnapshot => ({
  taskCount: 0,
  scheduledBlockCount: 0,
  pomodoroSessionCount: 0,
  calendarEventCount: 0,
  hasDriveBackupStatus: false,
  ...updates,
})

const statuses = (value: OnboardingSnapshot) =>
  getOnboardingSteps(value).map((step) => step.status)

describe('getOnboardingSteps', () => {
  it('starts with create task and locks the remaining main flow', () => {
    expect(statuses(snapshot())).toEqual([
      'next', 'locked', 'locked', 'optional', 'optional',
    ])
  })

  it('advances to scheduling after a task exists', () => {
    expect(statuses(snapshot({ taskCount: 1 }))).toEqual([
      'done', 'next', 'locked', 'optional', 'optional',
    ])
  })

  it('advances to Pomodoro after a scheduled block exists', () => {
    expect(statuses(snapshot({ taskCount: 1, scheduledBlockCount: 1 })))
      .toEqual(['done', 'done', 'next', 'optional', 'optional'])
  })

  it('completes the main flow after a Pomodoro session exists', () => {
    const steps = getOnboardingSteps(snapshot({
      taskCount: 1,
      scheduledBlockCount: 1,
      pomodoroSessionCount: 1,
    }))
    expect(steps.slice(0, 3).map((step) => step.status))
      .toEqual(['done', 'done', 'done'])
    expect(isMainOnboardingComplete(steps)).toBe(true)
  })

  it('marks Calendar as done without affecting the main flow', () => {
    expect(statuses(snapshot({ calendarEventCount: 2 })))
      .toEqual(['next', 'locked', 'locked', 'done', 'optional'])
  })

  it('marks Drive backup as done without affecting the main flow', () => {
    expect(statuses(snapshot({ hasDriveBackupStatus: true })))
      .toEqual(['next', 'locked', 'locked', 'optional', 'done'])
  })
})
