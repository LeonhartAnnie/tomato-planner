import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../domain/settings/defaultSettings'
import type { PomodoroSession, ScheduledBlock } from '../types'
import { pomodoroDexieRepository } from '../infrastructure/repositories/pomodoroDexieRepository'
import { usePomodoroStore } from './pomodoroStore'
import { useSettingsStore } from './settingsStore'

vi.mock('../infrastructure/repositories/pomodoroDexieRepository', () => ({
  pomodoroDexieRepository: {
    getAllPomodoroSessions: vi.fn(),
    addPomodoroSession: vi.fn(),
    updatePomodoroSession: vi.fn(),
    deletePomodoroSession: vi.fn(),
  },
}))

const session: PomodoroSession = {
  id: 'session-1',
  type: 'focus',
  startedAt: '2026-06-21T01:00:00.000Z',
  endedAt: '2026-06-21T01:25:00.000Z',
  completed: true,
}

const startInput = {
  type: 'focus' as const,
  durationMinutes: 25,
  startedAt: '2026-06-21T01:00:00.000Z',
}

const scheduledBlock: ScheduledBlock = {
  id: 'block-1',
  taskId: 'task-1',
  title: '排程專注',
  start: '2026-06-21T01:00:00.000Z',
  end: '2026-06-21T02:00:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
}

beforeEach(() => {
  usePomodoroStore.setState({
    sessions: [],
    activeTimer: undefined,
    lastCompletedSession: undefined,
    nextStep: undefined,
    isLoading: false,
    error: null,
  })
  useSettingsStore.setState({
    settings: { ...defaultSettings },
    isLoading: false,
    error: null,
  })
  vi.resetAllMocks()
  vi.mocked(pomodoroDexieRepository.getAllPomodoroSessions).mockResolvedValue([])
  vi.mocked(pomodoroDexieRepository.addPomodoroSession).mockResolvedValue()
})

describe('pomodoroStore', () => {
  it('loads sessions through the repository', async () => {
    vi.mocked(pomodoroDexieRepository.getAllPomodoroSessions).mockResolvedValue([
      session,
    ])

    await usePomodoroStore.getState().loadSessions()

    expect(usePomodoroStore.getState().sessions).toEqual([session])
  })

  it('starts a focus timer', () => {
    usePomodoroStore.getState().startTimer(startInput)

    expect(usePomodoroStore.getState().activeTimer).toMatchObject({
      type: 'focus',
      status: 'running',
      startedAt: startInput.startedAt,
    })
  })

  it('starts a focus timer for a scheduled block without using Dexie', () => {
    const succeeded = usePomodoroStore
      .getState()
      .startFocusForScheduledBlock(
        scheduledBlock,
        25,
        '2026-06-21T01:10:00.000Z',
      )

    expect(succeeded).toBe(true)
    expect(usePomodoroStore.getState().activeTimer).toMatchObject({
      taskId: scheduledBlock.taskId,
      scheduledBlockId: scheduledBlock.id,
      type: 'focus',
      durationMinutes: 60,
    })
    expect(pomodoroDexieRepository.addPomodoroSession).not.toHaveBeenCalled()
  })

  it('rejects a scheduled block with an invalid time', () => {
    const succeeded = usePomodoroStore
      .getState()
      .startFocusForScheduledBlock(
        { ...scheduledBlock, end: scheduledBlock.start },
        30,
        scheduledBlock.start,
      )

    expect(succeeded).toBe(false)
    expect(usePomodoroStore.getState().activeTimer).toBeUndefined()
    expect(usePomodoroStore.getState().error).toContain('此排程時間無效')
  })

  it('rejects a scheduled focus before the block starts', () => {
    const succeeded = usePomodoroStore
      .getState()
      .startFocusForScheduledBlock(
        scheduledBlock,
        30,
        '2026-06-21T00:59:00.000Z',
      )

    expect(succeeded).toBe(false)
    expect(usePomodoroStore.getState().activeTimer).toBeUndefined()
    expect(usePomodoroStore.getState().error).toContain('此排程尚未開始')
  })

  it('rejects a scheduled focus after the block ends', () => {
    const succeeded = usePomodoroStore
      .getState()
      .startFocusForScheduledBlock(
        scheduledBlock,
        30,
        scheduledBlock.end,
      )

    expect(succeeded).toBe(false)
    expect(usePomodoroStore.getState().activeTimer).toBeUndefined()
    expect(usePomodoroStore.getState().error).toContain('此排程已結束')
  })

  it('rejects a scheduled focus when a timer is already active', () => {
    usePomodoroStore.getState().startTimer(startInput)
    const existingTimer = usePomodoroStore.getState().activeTimer

    const succeeded = usePomodoroStore
      .getState()
      .startFocusForScheduledBlock(
        scheduledBlock,
        25,
        '2026-06-21T01:10:00.000Z',
      )

    expect(succeeded).toBe(false)
    expect(usePomodoroStore.getState().activeTimer).toBe(existingTimer)
    expect(usePomodoroStore.getState().error).toBeTruthy()
  })

  it('pauses the active timer', () => {
    usePomodoroStore.getState().startTimer(startInput)
    usePomodoroStore.getState().pauseTimer('2026-06-21T01:10:00.000Z')

    expect(usePomodoroStore.getState().activeTimer).toMatchObject({
      status: 'paused',
      remainingSecondsWhenPaused: 900,
    })
  })

  it('resumes the active timer', () => {
    usePomodoroStore.getState().startTimer(startInput)
    usePomodoroStore.getState().pauseTimer('2026-06-21T01:10:00.000Z')
    usePomodoroStore.getState().resumeTimer('2026-06-21T02:00:00.000Z')

    expect(usePomodoroStore.getState().activeTimer).toMatchObject({
      status: 'running',
      targetEndAt: '2026-06-21T02:15:00.000Z',
    })
  })

  it('completes the active timer, persists a session, and clears the timer', async () => {
    usePomodoroStore.getState().startTimer(startInput)

    await usePomodoroStore
      .getState()
      .completeTimer('2026-06-21T01:25:00.000Z')

    const state = usePomodoroStore.getState()
    expect(state.sessions).toHaveLength(1)
    expect(state.sessions[0]).toMatchObject({ completed: true, type: 'focus' })
    expect(state.activeTimer).toBeUndefined()
    expect(pomodoroDexieRepository.addPomodoroSession).toHaveBeenCalledWith(
      state.sessions[0],
    )
  })

  it('suggests a short break after completing focus before the interval', async () => {
    usePomodoroStore.getState().startTimer(startInput)

    await usePomodoroStore
      .getState()
      .completeTimer('2026-06-21T01:25:00.000Z')

    expect(usePomodoroStore.getState().nextStep).toEqual({
      nextType: 'short_break',
      reason: 'after_focus',
    })
  })

  it('suggests a long break after the configured number of focus sessions', async () => {
    const previousFocusSessions: PomodoroSession[] = [1, 2, 3].map(
      (index) => ({
        id: `previous-focus-${index}`,
        type: 'focus',
        startedAt: `2026-06-20T0${index}:00:00.000Z`,
        endedAt: `2026-06-20T0${index}:25:00.000Z`,
        completed: true,
      }),
    )
    usePomodoroStore.setState({ sessions: previousFocusSessions })
    usePomodoroStore.getState().startTimer(startInput)

    await usePomodoroStore
      .getState()
      .completeTimer('2026-06-21T01:25:00.000Z')

    expect(usePomodoroStore.getState().nextStep).toEqual({
      nextType: 'long_break',
      reason: 'after_focus',
    })
  })

  it('suggests focus after completing a break', async () => {
    usePomodoroStore.getState().startTimer({
      type: 'short_break',
      durationMinutes: 5,
      startedAt: '2026-06-21T02:00:00.000Z',
    })

    await usePomodoroStore
      .getState()
      .completeTimer('2026-06-21T02:05:00.000Z')

    expect(usePomodoroStore.getState().nextStep).toEqual({
      nextType: 'focus',
      reason: 'after_break',
    })
  })

  it('starts a short break from the next-step suggestion', () => {
    usePomodoroStore.setState({
      lastCompletedSession: session,
      nextStep: { nextType: 'short_break', reason: 'after_focus' },
    })

    const succeeded = usePomodoroStore.getState().startBreakFromNextStep()

    expect(succeeded).toBe(true)
    expect(usePomodoroStore.getState().activeTimer).toMatchObject({
      type: 'short_break',
      durationMinutes: defaultSettings.shortBreakMinutes,
    })
    expect(usePomodoroStore.getState().nextStep).toBeUndefined()
    expect(pomodoroDexieRepository.addPomodoroSession).not.toHaveBeenCalled()
  })

  it('starts a long break from the next-step suggestion', () => {
    usePomodoroStore.setState({
      lastCompletedSession: session,
      nextStep: { nextType: 'long_break', reason: 'after_focus' },
    })

    const succeeded = usePomodoroStore.getState().startBreakFromNextStep()

    expect(succeeded).toBe(true)
    expect(usePomodoroStore.getState().activeTimer).toMatchObject({
      type: 'long_break',
      durationMinutes: defaultSettings.longBreakMinutes,
    })
  })

  it('sets an error when starting a break without a next step', () => {
    const succeeded = usePomodoroStore.getState().startBreakFromNextStep()

    expect(succeeded).toBe(false)
    expect(usePomodoroStore.getState().error).toBeTruthy()
  })

  it('sets an error for invalid start input', () => {
    usePomodoroStore.getState().startTimer({
      type: 'focus',
      durationMinutes: 0,
      startedAt: startInput.startedAt,
    })

    expect(usePomodoroStore.getState().error).toBeTruthy()
  })

  it('sets isLoading during an async operation and clears it afterward', async () => {
    let resolveSessions: (sessions: PomodoroSession[]) => void = () => undefined
    const pendingSessions = new Promise<PomodoroSession[]>((resolve) => {
      resolveSessions = resolve
    })
    vi.mocked(
      pomodoroDexieRepository.getAllPomodoroSessions,
    ).mockReturnValue(pendingSessions)

    const loading = usePomodoroStore.getState().loadSessions()
    expect(usePomodoroStore.getState().isLoading).toBe(true)

    resolveSessions([session])
    await loading

    expect(usePomodoroStore.getState().isLoading).toBe(false)
  })
})
