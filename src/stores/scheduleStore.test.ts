import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CalendarGateway } from '../application/calendar/calendarGateway'
import type { GoogleCalendarEventDto } from '../infrastructure/google/googleCalendarTypes'
import { scheduleDexieRepository } from '../infrastructure/repositories/scheduleDexieRepository'
import type { CalendarEvent, ScheduledBlock } from '../types'
import { addDaysIso, startOfDayIso } from '../utils/dateTime'
import { useScheduleStore } from './scheduleStore'

vi.mock('../infrastructure/repositories/scheduleDexieRepository', () => ({
  scheduleDexieRepository: {
    getAllScheduledBlocks: vi.fn(),
    addScheduledBlock: vi.fn(),
    updateScheduledBlock: vi.fn(),
    deleteScheduledBlock: vi.fn(),
    getAllCalendarEvents: vi.fn(),
    setCalendarEvents: vi.fn(),
  },
}))

const block: ScheduledBlock = {
  id: 'block-1',
  taskId: 'task-1',
  title: '既有排程',
  start: '2026-06-21T01:00:00.000Z',
  end: '2026-06-21T02:00:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const calendarEvent: CalendarEvent = {
  id: 'event-1',
  title: '會議',
  start: '2026-06-21T03:00:00.000Z',
  end: '2026-06-21T04:00:00.000Z',
  source: 'google_calendar',
  readonly: true,
}

const validInput = {
  taskId: 'task-2',
  title: '新增排程',
  start: '2026-06-21T05:00:00.000Z',
  end: '2026-06-21T06:00:00.000Z',
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-21T00:00:00.000Z'))
  useScheduleStore.setState({
    blocks: [],
    calendarEvents: [],
    googleCalendarStatus: 'idle',
    googleCalendarError: undefined,
    googleCalendarLastImportedAt: undefined,
    isLoading: false,
    error: null,
  })
  vi.resetAllMocks()
  vi.mocked(scheduleDexieRepository.getAllScheduledBlocks).mockResolvedValue([])
  vi.mocked(scheduleDexieRepository.getAllCalendarEvents).mockResolvedValue([])
  vi.mocked(scheduleDexieRepository.addScheduledBlock).mockResolvedValue()
  vi.mocked(scheduleDexieRepository.updateScheduledBlock).mockResolvedValue()
  vi.mocked(scheduleDexieRepository.deleteScheduledBlock).mockResolvedValue()
  vi.mocked(scheduleDexieRepository.setCalendarEvents).mockResolvedValue()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('scheduleStore', () => {
  it('loads blocks and calendar events', async () => {
    vi.mocked(scheduleDexieRepository.getAllScheduledBlocks).mockResolvedValue([
      block,
    ])
    vi.mocked(scheduleDexieRepository.getAllCalendarEvents).mockResolvedValue([
      calendarEvent,
    ])

    await useScheduleStore.getState().loadSchedule()

    expect(useScheduleStore.getState()).toMatchObject({
      blocks: [block],
      calendarEvents: [calendarEvent],
    })
  })

  it('adds a valid scheduled block', async () => {
    await useScheduleStore.getState().addBlock(validInput)

    expect(useScheduleStore.getState().blocks[0]).toMatchObject({
      ...validInput,
      source: 'manual',
      syncedToGoogleCalendar: false,
    })
  })

  it('sets an error for an invalid time range', async () => {
    await useScheduleStore.getState().addBlock({
      ...validInput,
      end: validInput.start,
    })

    expect(useScheduleStore.getState().error).toBeTruthy()
    expect(scheduleDexieRepository.addScheduledBlock).not.toHaveBeenCalled()
  })

  it('sets an error and does not add a conflicting block', async () => {
    useScheduleStore.setState({ blocks: [block] })

    await useScheduleStore.getState().addBlock({
      ...validInput,
      start: '2026-06-21T01:30:00.000Z',
      end: '2026-06-21T02:30:00.000Z',
    })

    expect(useScheduleStore.getState().error).toBeTruthy()
    expect(useScheduleStore.getState().blocks).toEqual([block])
    expect(scheduleDexieRepository.addScheduledBlock).not.toHaveBeenCalled()
  })

  it('updates a block through the application use case', async () => {
    useScheduleStore.setState({ blocks: [block] })

    await useScheduleStore.getState().updateBlock({
      ...block,
      title: '更新排程',
    })

    expect(useScheduleStore.getState().blocks[0]).toMatchObject({
      title: '更新排程',
      updatedAt: '2026-06-21T00:00:00.000Z',
    })
  })

  it('does not update a block when its new time conflicts', async () => {
    const otherBlock = {
      ...block,
      id: 'block-2',
      start: '2026-06-21T05:00:00.000Z',
      end: '2026-06-21T06:00:00.000Z',
    }
    useScheduleStore.setState({ blocks: [block, otherBlock] })

    const succeeded = await useScheduleStore.getState().updateBlock({
      ...block,
      start: otherBlock.start,
      end: otherBlock.end,
    })

    expect(succeeded).toBe(false)
    expect(scheduleDexieRepository.updateScheduledBlock).not.toHaveBeenCalled()
    expect(useScheduleStore.getState().error).toBeTruthy()
  })

  it('deletes a block', async () => {
    useScheduleStore.setState({ blocks: [block] })

    await useScheduleStore.getState().deleteBlock(block.id)

    expect(useScheduleStore.getState().blocks).toEqual([])
    expect(scheduleDexieRepository.deleteScheduledBlock).toHaveBeenCalledWith(
      block.id,
    )
  })

  it('sets calendar events', async () => {
    await useScheduleStore.getState().setCalendarEvents([calendarEvent])

    expect(useScheduleStore.getState().calendarEvents).toEqual([calendarEvent])
  })

  it('imports Google Calendar events and persists mapped events', async () => {
    const gateway: CalendarGateway = {
      fetchEvents: vi.fn().mockResolvedValue([
        {
          id: 'google-event-1',
          summary: 'Google meeting',
          start: { dateTime: '2026-06-22T01:00:00.000Z' },
          end: { dateTime: '2026-06-22T02:00:00.000Z' },
        },
      ]),
    }

    const succeeded = await useScheduleStore
      .getState()
      .importGoogleCalendarEvents(gateway)

    expect(succeeded).toBe(true)
    const expectedStart = startOfDayIso('2026-06-21T00:00:00.000Z')
    expect(gateway.fetchEvents).toHaveBeenCalledWith(
      expectedStart,
      addDaysIso(expectedStart, 7),
    )
    expect(useScheduleStore.getState().calendarEvents).toEqual([
      expect.objectContaining({
        id: 'google-event-1',
        title: 'Google meeting',
        readonly: true,
      }),
    ])
    expect(scheduleDexieRepository.setCalendarEvents).toHaveBeenCalledWith(
      useScheduleStore.getState().calendarEvents,
    )
    expect(useScheduleStore.getState()).toMatchObject({
      googleCalendarStatus: 'success',
      googleCalendarLastImportedAt: '2026-06-21T00:00:00.000Z',
    })
  })

  it('sets Google Calendar status to importing while the gateway is pending', async () => {
    let resolveEvents: (events: GoogleCalendarEventDto[]) => void =
      () => undefined
    const pendingEvents = new Promise<GoogleCalendarEventDto[]>((resolve) => {
      resolveEvents = resolve
    })
    const gateway: CalendarGateway = {
      fetchEvents: vi.fn().mockReturnValue(pendingEvents),
    }

    const importing = useScheduleStore
      .getState()
      .importGoogleCalendarEvents(gateway)

    expect(useScheduleStore.getState().googleCalendarStatus).toBe('importing')
    resolveEvents([])
    await importing
  })

  it('sets an error when the injected Google gateway fails', async () => {
    const gateway: CalendarGateway = {
      fetchEvents: vi.fn().mockRejectedValue(new Error('Google unavailable')),
    }

    useScheduleStore.setState({ calendarEvents: [calendarEvent] })

    const succeeded = await useScheduleStore
      .getState()
      .importGoogleCalendarEvents(gateway)

    expect(succeeded).toBe(false)
    expect(useScheduleStore.getState().error).toBe('Google unavailable')
    expect(useScheduleStore.getState()).toMatchObject({
      calendarEvents: [calendarEvent],
      googleCalendarStatus: 'error',
      googleCalendarError: 'Google unavailable',
    })
    expect(scheduleDexieRepository.setCalendarEvents).not.toHaveBeenCalled()
  })

  it('clears only local calendar events and preserves scheduled blocks', async () => {
    useScheduleStore.setState({
      blocks: [block],
      calendarEvents: [calendarEvent],
      googleCalendarStatus: 'success',
      googleCalendarLastImportedAt: '2026-06-20T00:00:00.000Z',
    })

    const succeeded = await useScheduleStore.getState().clearCalendarEvents()

    expect(succeeded).toBe(true)
    expect(scheduleDexieRepository.setCalendarEvents).toHaveBeenCalledWith([])
    expect(useScheduleStore.getState()).toMatchObject({
      blocks: [block],
      calendarEvents: [],
      googleCalendarStatus: 'idle',
    })
    expect(useScheduleStore.getState().googleCalendarLastImportedAt).toBeUndefined()
  })

  it('resets Google Calendar import status and error', () => {
    useScheduleStore.setState({
      error: 'Authorization failed',
      googleCalendarStatus: 'error',
      googleCalendarError: 'Authorization failed',
      googleCalendarLastImportedAt: '2026-06-20T00:00:00.000Z',
    })

    useScheduleStore.getState().resetGoogleCalendarImportState()

    expect(useScheduleStore.getState()).toMatchObject({
      error: null,
      googleCalendarStatus: 'idle',
    })
    expect(useScheduleStore.getState().googleCalendarError).toBeUndefined()
    expect(useScheduleStore.getState().googleCalendarLastImportedAt).toBeUndefined()
  })

  it('sets isLoading during async loading and clears it afterward', async () => {
    let resolveBlocks: (blocks: ScheduledBlock[]) => void = () => undefined
    const pendingBlocks = new Promise<ScheduledBlock[]>((resolve) => {
      resolveBlocks = resolve
    })
    vi.mocked(
      scheduleDexieRepository.getAllScheduledBlocks,
    ).mockReturnValue(pendingBlocks)

    const loading = useScheduleStore.getState().loadSchedule()
    expect(useScheduleStore.getState().isLoading).toBe(true)

    resolveBlocks([block])
    await loading
    expect(useScheduleStore.getState().isLoading).toBe(false)
  })
})
