import type { CalendarGateway } from '../../application/calendar/calendarGateway'
import type {
  GoogleCalendarEventDto,
  GoogleCalendarEventsListDto,
} from './googleCalendarTypes'

export const GOOGLE_CALENDAR_READONLY_SCOPE =
  'https://www.googleapis.com/auth/calendar.readonly'

const GOOGLE_IDENTITY_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
const GOOGLE_IDENTITY_SCRIPT_ID = 'google-identity-services'
const CALENDAR_EVENTS_URL =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events'

let googleIdentityLoadPromise: Promise<void> | undefined

const loadGoogleIdentityServices = (): Promise<void> => {
  if (window.google?.accounts.oauth2) {
    return Promise.resolve()
  }

  if (googleIdentityLoadPromise) {
    return googleIdentityLoadPromise
  }

  googleIdentityLoadPromise = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID)
    const script =
      existingScript instanceof HTMLScriptElement
        ? existingScript
        : document.createElement('script')

    const handleLoad = () => {
      if (window.google?.accounts.oauth2) {
        resolve()
      } else {
        reject(new Error('Google Identity Services failed to initialize'))
      }
    }
    const handleError = () =>
      reject(new Error('Unable to load Google Identity Services'))

    script.addEventListener('load', handleLoad, { once: true })
    script.addEventListener('error', handleError, { once: true })

    if (!existingScript) {
      script.id = GOOGLE_IDENTITY_SCRIPT_ID
      script.src = GOOGLE_IDENTITY_SCRIPT_URL
      script.async = true
      script.defer = true
      document.head.append(script)
    }
  })

  return googleIdentityLoadPromise
}

const requestCalendarAccessToken = async (clientId: string): Promise<string> => {
  await loadGoogleIdentityServices()

  return new Promise<string>((resolve, reject) => {
    const oauth2 = window.google?.accounts.oauth2
    if (!oauth2) {
      reject(new Error('Google Identity Services is unavailable'))
      return
    }

    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_CALENDAR_READONLY_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new Error(
              response.error_description ??
                response.error ??
                'Google authorization did not return an access token',
            ),
          )
          return
        }
        resolve(response.access_token)
      },
      error_callback: (error) => {
        reject(new Error(error.message ?? error.type ?? 'Google authorization failed'))
      },
    })

    tokenClient.requestAccessToken()
  })
}

const fetchCalendarPage = async (
  accessToken: string,
  startIso: string,
  endIso: string,
  pageToken?: string,
): Promise<GoogleCalendarEventsListDto> => {
  const query = new URLSearchParams({
    timeMin: startIso,
    timeMax: endIso,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '2500',
  })
  if (pageToken) {
    query.set('pageToken', pageToken)
  }

  const response = await fetch(`${CALENDAR_EVENTS_URL}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) {
    throw new Error(
      `Google Calendar request failed (${response.status} ${response.statusText})`,
    )
  }

  return (await response.json()) as GoogleCalendarEventsListDto
}

export const googleCalendarGateway: CalendarGateway = {
  fetchEvents: async (startIso, endIso): Promise<GoogleCalendarEventDto[]> => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()
    if (!clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID is not configured')
    }

    const accessToken = await requestCalendarAccessToken(clientId)
    const events: GoogleCalendarEventDto[] = []
    let pageToken: string | undefined

    do {
      const page = await fetchCalendarPage(
        accessToken,
        startIso,
        endIso,
        pageToken,
      )
      events.push(...(page.items ?? []))
      pageToken = page.nextPageToken
    } while (pageToken)

    return events
  },
}
