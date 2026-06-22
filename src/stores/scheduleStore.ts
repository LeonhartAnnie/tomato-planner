import { create } from 'zustand'
import type { CalendarGateway } from '../application/calendar/calendarGateway'
import { importGoogleCalendarEvents as importCalendarEvents } from '../application/calendar/importGoogleCalendarEvents'
import {
  createScheduledBlock,
  type CreateScheduledBlockInput,
} from '../application/schedule/createScheduledBlock'
import { deleteScheduledBlock } from '../application/schedule/deleteScheduledBlock'
import { updateScheduledBlock } from '../application/schedule/updateScheduledBlock'
import { scheduleDexieRepository } from '../infrastructure/repositories/scheduleDexieRepository'
import { googleCalendarGateway } from '../infrastructure/google/googleCalendarGateway'
import type { CalendarEvent, ScheduledBlock } from '../types'
import { addDaysIso, nowIso, startOfDayIso } from '../utils/dateTime'
import { toErrorMessage } from '../utils/error'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyErrorMessage'

export type GoogleCalendarImportStatus =
  | 'idle'
  | 'importing'
  | 'success'
  | 'error'

interface ScheduleState {
  blocks: ScheduledBlock[]
  calendarEvents: CalendarEvent[]
  googleCalendarStatus: GoogleCalendarImportStatus
  googleCalendarError?: string
  googleCalendarLastImportedAt?: string
  isLoading: boolean
  error: string | null
  loadSchedule: () => Promise<void>
  addBlock: (input: CreateScheduledBlockInput) => Promise<boolean>
  updateBlock: (block: ScheduledBlock) => Promise<boolean>
  deleteBlock: (id: string) => Promise<boolean>
  setCalendarEvents: (events: CalendarEvent[]) => Promise<boolean>
  importGoogleCalendarEvents: (gateway?: CalendarGateway) => Promise<boolean>
  clearCalendarEvents: () => Promise<boolean>
  resetGoogleCalendarImportState: () => void
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  blocks: [],
  calendarEvents: [],
  googleCalendarStatus: 'idle',
  googleCalendarError: undefined,
  googleCalendarLastImportedAt: undefined,
  isLoading: false,
  error: null,

  loadSchedule: async () => {
    set({ isLoading: true, error: null })
    try {
      const [blocks, calendarEvents] = await Promise.all([
        scheduleDexieRepository.getAllScheduledBlocks(),
        scheduleDexieRepository.getAllCalendarEvents(),
      ])
      set({ blocks, calendarEvents })
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  addBlock: async (input) => {
    set({ isLoading: true, error: null })
    try {
      const block = await createScheduledBlock(
        input,
        scheduleDexieRepository,
        get().blocks,
        get().calendarEvents,
      )
      set((state) => ({ blocks: [...state.blocks, block] }))
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  updateBlock: async (block) => {
    set({ isLoading: true, error: null })
    try {
      const updatedBlock = await updateScheduledBlock(
        block,
        scheduleDexieRepository,
        get().blocks,
        get().calendarEvents,
      )
      set((state) => ({
        blocks: state.blocks.map((item) =>
          item.id === updatedBlock.id ? updatedBlock : item,
        ),
      }))
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  deleteBlock: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await deleteScheduledBlock(id, scheduleDexieRepository)
      set((state) => ({
        blocks: state.blocks.filter((block) => block.id !== id),
      }))
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  setCalendarEvents: async (events) => {
    set({ isLoading: true, error: null })
    try {
      await scheduleDexieRepository.setCalendarEvents(events)
      set({ calendarEvents: events })
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  importGoogleCalendarEvents: async (gateway = googleCalendarGateway) => {
    set({
      isLoading: true,
      error: null,
      googleCalendarStatus: 'importing',
      googleCalendarError: undefined,
    })
    try {
      const startIso = startOfDayIso()
      const endIso = addDaysIso(startIso, 7)
      const calendarEvents = await importCalendarEvents({
        gateway,
        startIso,
        endIso,
      })
      await scheduleDexieRepository.setCalendarEvents(calendarEvents)
      set({
        calendarEvents,
        googleCalendarStatus: 'success',
        googleCalendarError: undefined,
        googleCalendarLastImportedAt: nowIso(),
      })
      return true
    } catch (error: unknown) {
      const errorMessage = toUserFriendlyErrorMessage(
        error,
        'google-calendar',
      )
      set({
        error: errorMessage,
        googleCalendarStatus: 'error',
        googleCalendarError: errorMessage,
      })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  clearCalendarEvents: async () => {
    set({ isLoading: true, error: null })
    try {
      await scheduleDexieRepository.setCalendarEvents([])
      set({
        calendarEvents: [],
        googleCalendarStatus: 'idle',
        googleCalendarError: undefined,
        googleCalendarLastImportedAt: undefined,
      })
      return true
    } catch (error: unknown) {
      const errorMessage = toErrorMessage(error)
      set({
        error: errorMessage,
        googleCalendarStatus: 'error',
        googleCalendarError: errorMessage,
      })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  resetGoogleCalendarImportState: () =>
    set({
      error: null,
      googleCalendarStatus: 'idle',
      googleCalendarError: undefined,
      googleCalendarLastImportedAt: undefined,
    }),
}))
