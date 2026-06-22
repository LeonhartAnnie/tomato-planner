import { create } from 'zustand'
import { completePomodoro } from '../application/pomodoro/completePomodoro'
import { getNextPomodoroType } from '../application/pomodoro/getNextPomodoroType'
import {
  getPomodoroNextStep,
  type PomodoroNextStep,
} from '../application/pomodoro/getPomodoroNextStep'
import { getPomodoroRemainingSeconds } from '../application/pomodoro/getPomodoroRemainingSeconds'
import { pausePomodoro } from '../application/pomodoro/pausePomodoro'
import { resumePomodoro } from '../application/pomodoro/resumePomodoro'
import {
  startPomodoro,
  type StartPomodoroInput,
} from '../application/pomodoro/startPomodoro'
import { startPomodoroForScheduledBlock } from '../application/pomodoro/startPomodoroForScheduledBlock'
import { pomodoroDexieRepository } from '../infrastructure/repositories/pomodoroDexieRepository'
import type { PomodoroSession, PomodoroTimer, ScheduledBlock } from '../types'
import { toErrorMessage } from '../utils/error'
import { useSettingsStore } from './settingsStore'

type PomodoroType = PomodoroTimer['type']

interface PomodoroState {
  sessions: PomodoroSession[]
  activeTimer?: PomodoroTimer
  lastCompletedSession?: PomodoroSession
  nextStep?: PomodoroNextStep
  isLoading: boolean
  error: string | null
  loadSessions: () => Promise<void>
  startTimer: (input: StartPomodoroInput) => void
  startFocusForScheduledBlock: (
    block: ScheduledBlock,
    durationMinutes: number,
  ) => boolean
  pauseTimer: (now?: string) => void
  resumeTimer: (now?: string) => void
  completeTimer: (now?: string) => Promise<void>
  startBreakFromNextStep: () => boolean
  clearNextStep: () => void
  getRemainingSeconds: (now?: string) => number
  getNextType: (
    completedType: PomodoroType,
    completedFocusCount: number,
    longBreakInterval: number,
  ) => PomodoroType
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  sessions: [],
  activeTimer: undefined,
  lastCompletedSession: undefined,
  nextStep: undefined,
  isLoading: false,
  error: null,

  loadSessions: async () => {
    set({ isLoading: true, error: null })
    try {
      set({ sessions: await pomodoroDexieRepository.getAllPomodoroSessions() })
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  startTimer: (input) => {
    try {
      set({ activeTimer: startPomodoro(input), nextStep: undefined, error: null })
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
    }
  },

  startFocusForScheduledBlock: (block, durationMinutes) => {
    const activeTimer = get().activeTimer
    if (
      activeTimer?.status === 'running' ||
      activeTimer?.status === 'paused'
    ) {
      set({ error: '請先完成目前的番茄鐘，再開始新的計時。' })
      return false
    }

    try {
      set({
        activeTimer: startPomodoroForScheduledBlock(block, durationMinutes),
        nextStep: undefined,
        error: null,
      })
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    }
  },

  pauseTimer: (now) => {
    const timer = get().activeTimer
    if (!timer) {
      set({ error: '目前沒有進行中的番茄鐘。' })
      return
    }

    try {
      set({ activeTimer: pausePomodoro(timer, now), error: null })
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
    }
  },

  resumeTimer: (now) => {
    const timer = get().activeTimer
    if (!timer) {
      set({ error: '目前沒有進行中的番茄鐘。' })
      return
    }

    try {
      set({ activeTimer: resumePomodoro(timer, now), error: null })
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
    }
  },

  completeTimer: async (now) => {
    const timer = get().activeTimer
    if (!timer) {
      set({ error: '目前沒有進行中的番茄鐘。' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const session = await completePomodoro(
        timer,
        pomodoroDexieRepository,
        now,
      )
      const sessions = [...get().sessions, session]
      const nextStep = getPomodoroNextStep(
        session,
        sessions,
        useSettingsStore.getState().settings.longBreakInterval,
      )
      set({
        sessions,
        activeTimer: undefined,
        lastCompletedSession: session,
        nextStep,
      })
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  startBreakFromNextStep: () => {
    const { activeTimer, lastCompletedSession, nextStep } = get()
    if (!nextStep) {
      set({ error: '目前沒有可開始的下一段番茄鐘。' })
      return false
    }
    if (nextStep.nextType === 'focus') {
      set({ error: '下一段建議是專注，不是休息。' })
      return false
    }
    if (activeTimer?.status === 'running' || activeTimer?.status === 'paused') {
      set({ error: '請先完成目前的番茄鐘，再開始新的計時。' })
      return false
    }

    const settings = useSettingsStore.getState().settings
    const durationMinutes =
      nextStep.nextType === 'short_break'
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes

    try {
      set({
        activeTimer: startPomodoro({
          type: nextStep.nextType,
          durationMinutes,
          taskId: lastCompletedSession?.taskId,
          scheduledBlockId: lastCompletedSession?.scheduledBlockId,
        }),
        nextStep: undefined,
        error: null,
      })
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    }
  },

  clearNextStep: () => set({ nextStep: undefined, error: null }),

  getRemainingSeconds: (now) =>
    getPomodoroRemainingSeconds(get().activeTimer, now),

  getNextType: (completedType, completedFocusCount, longBreakInterval) => {
    try {
      const nextType = getNextPomodoroType(
        completedType,
        completedFocusCount,
        longBreakInterval,
      )
      set({ error: null })
      return nextType
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      throw error
    }
  },
}))
