import { useState, useCallback, useRef } from 'react'
import type { CalendarEvent } from '../types'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const SCOPES = 'https://www.googleapis.com/auth/calendar'
const CALENDAR_ID = 'primary'

interface GsiTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => GsiTokenClient
        }
      }
    }
  }
}

function loadGIS(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts) { resolve(); return }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

// Google Calendar REST API Event (vereinfacht)
interface GCalEvent {
  id: string
  summary?: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  recurrence?: string[]
}

export function useGoogleCalendar() {
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const clientRef = useRef<GsiTokenClient | null>(null)

  const connect = useCallback((): Promise<string> => {
    if (!CLIENT_ID) {
      setError('VITE_GOOGLE_CLIENT_ID nicht gesetzt — siehe Setup-Anleitung.')
      return Promise.reject('no client id')
    }
    return new Promise(async (resolve, reject) => {
      await loadGIS()
      const client = window.google!.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error || !response.access_token) {
            const msg = response.error ?? 'Unbekannter Fehler'
            setError(msg)
            reject(msg)
            return
          }
          tokenRef.current = response.access_token
          setIsConnected(true)
          setError(null)
          resolve(response.access_token)
        },
      })
      clientRef.current = client
      client.requestAccessToken()
    })
  }, [])

  async function getToken(): Promise<string> {
    if (tokenRef.current) return tokenRef.current
    return connect()
  }

  /** Einen bereits exportierten Google-Termin aktualisieren. */
  async function updateGoogleEvent(googleEventId: string, event: CalendarEvent): Promise<boolean> {
    setError(null)
    try {
      const token = await getToken()
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      const body: Record<string, unknown> = {
        summary: event.title,
        location: event.location ?? null,
        description: event.description ?? null,
        start: { dateTime: event.start.toISOString(), timeZone: tz },
        end: { dateTime: event.end.toISOString(), timeZone: tz },
        reminders: event.reminderMinutes != null && event.reminderMinutes > 0
          ? { useDefault: false, overrides: [{ method: 'popup', minutes: event.reminderMinutes }] }
          : { useDefault: true },
      }
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${googleEventId}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(err.error?.message ?? res.statusText)
      }
      return true
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      return false
    }
  }

  /** Einen App-Termin in den Google Kalender exportieren. Gibt Google Event ID zurück. */
  async function exportEvent(event: CalendarEvent): Promise<string | null> {
    setError(null)
    try {
      const token = await getToken()
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

      const body: Record<string, unknown> = {
        summary: event.title,
        ...(event.location && { location: event.location }),
        ...(event.description && { description: event.description }),
        start: { dateTime: event.start.toISOString(), timeZone: tz },
        end: { dateTime: event.end.toISOString(), timeZone: tz },
        reminders: event.reminderMinutes != null && event.reminderMinutes > 0
          ? { useDefault: false, overrides: [{ method: 'popup', minutes: event.reminderMinutes }] }
          : { useDefault: true },
      }

      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(err.error?.message ?? res.statusText)
      }
      const data = await res.json() as GCalEvent
      return data.id
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      return null
    }
  }

  /** Google Kalender-Einträge für einen Zeitraum importieren. */
  async function importEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    setIsSyncing(true)
    setError(null)
    try {
      const token = await getToken()
      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      })
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(err.error?.message ?? res.statusText)
      }
      const data = await res.json() as { items?: GCalEvent[] }
      return (data.items ?? []).map(item => ({
        id: `gcal_${item.id}`,
        title: item.summary ?? '(kein Titel)',
        start: new Date(item.start.dateTime ?? item.start.date ?? ''),
        end: new Date(item.end.dateTime ?? item.end.date ?? ''),
        location: item.location,
        description: item.description,
        createdBy: 'google',
        googleEventId: item.id,
      } satisfies CalendarEvent))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      return []
    } finally {
      setIsSyncing(false)
    }
  }

  function disconnect() {
    tokenRef.current = null
    clientRef.current = null
    setIsConnected(false)
  }

  return {
    isConnected,
    isSyncing,
    error,
    connect,
    exportEvent,
    updateGoogleEvent,
    importEvents,
    disconnect,
  }
}
