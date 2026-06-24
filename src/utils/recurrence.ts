import {
  addDays,
  addWeeks,
  addMonths,
  getDay,
  getDaysInMonth,
  isBefore,
  isAfter,
  startOfMonth,
} from 'date-fns'
import type { CalendarEvent, RecurrenceRule } from '../types'

/**
 * Gibt alle Instanzen eines Wiederholungs-Termins zurück,
 * die in den Bereich [rangeStart, rangeEnd] fallen.
 */
export function expandRecurring(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  if (!event.recurrence || event.recurrence.freq === 'none') {
    // Kein Wiederholungstermin – nur zurückgeben falls im Bereich
    if (isBefore(event.start, rangeEnd) && isAfter(event.end, rangeStart)) {
      return [event]
    }
    return []
  }

  const rule = event.recurrence
  const duration = event.end.getTime() - event.start.getTime()
  const until = rule.until ? new Date(rule.until) : rangeEnd
  const instances: CalendarEvent[] = []

  let current = new Date(event.start)
  let safety = 0

  while (!isAfter(current, rangeEnd) && !isAfter(current, until) && safety < 500) {
    safety++

    if (!isBefore(current, rangeStart)) {
      instances.push({
        ...event,
        id: `${event.id}_${current.getTime()}`,
        start: new Date(current),
        end: new Date(current.getTime() + duration),
      })
    }

    // Nächste Instanz berechnen
    switch (rule.freq) {
      case 'daily':
        current = addDays(current, rule.interval || 1)
        break

      case 'weekly':
        current = addWeeks(current, rule.interval || 1)
        break

      case 'monthly_date':
        current = addMonths(current, rule.interval || 1)
        break

      case 'monthly_weekday': {
        // z.B. jeden 2. Dienstag → nächsten Monat suchen
        current = addMonths(current, 1)
        current = getNthWeekdayOfMonth(
          current,
          rule.weekday ?? 1,
          rule.weekdayOrdinal ?? 1
        )
        break
      }
    }
  }

  return instances
}

/**
 * Gibt den N-ten Wochentag eines Monats zurück.
 * ordinal: 1=erster, 2=zweiter, 3=dritter, 4=vierter, -1=letzter
 * weekday: 0=Mo, 1=Di, 2=Mi, 3=Do, 4=Fr, 5=Sa, 6=So
 */
export function getNthWeekdayOfMonth(date: Date, weekday: number, ordinal: number): Date {
  // date-fns: getDay() gibt 0=So … 6=Sa, wir nutzen 0=Mo … 6=So
  const dfWeekday = weekday === 6 ? 0 : weekday + 1 // umrechnen

  const monthStart = startOfMonth(date)

  if (ordinal > 0) {
    // Ersten passenden Tag im Monat finden
    let d = new Date(monthStart)
    while (getDay(d) !== dfWeekday) {
      d = addDays(d, 1)
    }
    // N-1 Wochen draufaddieren
    d = addWeeks(d, ordinal - 1)
    // Sicherstellen dass wir noch im gleichen Monat sind
    if (d.getMonth() !== monthStart.getMonth()) {
      d = addWeeks(d, -1)
    }
    return d
  } else {
    // Letzten passenden Tag im Monat finden
    let d = new Date(date.getFullYear(), date.getMonth(), getDaysInMonth(date))
    while (getDay(d) !== dfWeekday) {
      d = addDays(d, -1)
    }
    return d
  }
}

/** Lesbare Beschreibung der Wiederholungsregel */
export function recurrenceLabel(rule: RecurrenceRule): string {
  const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
  const ordinals = ['', 'ersten', 'zweiten', 'dritten', 'vierten', 'letzten']

  switch (rule.freq) {
    case 'none': return 'Keine Wiederholung'
    case 'daily':
      return rule.interval === 1 ? 'Täglich' : `Alle ${rule.interval} Tage`
    case 'weekly': {
      const day = weekdays[rule.weekday ?? 0]
      return rule.interval === 1 ? `Wöchentlich (${day})` : `Alle ${rule.interval} Wochen (${day})`
    }
    case 'monthly_date':
      return rule.interval === 1 ? 'Monatlich' : `Alle ${rule.interval} Monate`
    case 'monthly_weekday': {
      const ord = ordinals[rule.weekdayOrdinal ?? 1] ?? `${rule.weekdayOrdinal}.`
      const day = weekdays[rule.weekday ?? 0]
      return `Jeden ${ord} ${day} im Monat`
    }
    default: return ''
  }
}
