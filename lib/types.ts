export type DateMode = "specific" | "daysOfWeek"

export interface MeetEvent {
  id: string
  name: string
  dateMode: DateMode
  dates: string[] // ISO date strings e.g. "2026-02-15" or day names e.g. "Monday"
  startHour: number // e.g. 9 for 9:00 AM
  endHour: number // e.g. 17 for 5:00 PM
  createdAt: number
}

// availability[username][dateString][slotIndex] = true/false
export type AvailabilityMap = Record<string, Record<string, boolean[]>>

// --- Helpers ---

export function generateTimeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    for (let half = 0; half < 2; half++) {
      const minutes = half === 0 ? "00" : "30"
      const displayHour = hour % 12 === 0 ? 12 : hour % 12
      const ampm = hour < 12 ? "AM" : "PM"
      slots.push(`${displayHour}:${minutes} ${ampm}`)
    }
  }
  return slots
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

export { DAY_NAMES }

export function formatDateShort(dateStr: string, dateMode: DateMode = "specific"): { dayName: string; monthDay: string } {
  if (dateMode === "daysOfWeek") {
    const short = dateStr.slice(0, 3) // "Mon", "Tue", etc.
    return { dayName: short, monthDay: "" }
  }
  const date = new Date(dateStr + "T12:00:00")
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" })
  const monthDay = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return { dayName, monthDay }
}

export function generateEventId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let id = ""
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

// --- localStorage persistence ---

const EVENT_PREFIX = "meetsync:event:"
const AVAIL_PREFIX = "meetsync:avail:"

export function saveEvent(event: MeetEvent): void {
  if (typeof window === "undefined") return
  localStorage.setItem(EVENT_PREFIX + event.id, JSON.stringify(event))
}

export function loadEvent(id: string): MeetEvent | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(EVENT_PREFIX + id)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as MeetEvent
    // Backward compat: events created before dateMode was added
    if (!parsed.dateMode) parsed.dateMode = "specific"
    return parsed
  } catch {
    return null
  }
}

export function saveAvailability(eventId: string, availability: AvailabilityMap): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AVAIL_PREFIX + eventId, JSON.stringify(availability))
}

export function loadAvailability(eventId: string): AvailabilityMap {
  if (typeof window === "undefined") return {}
  const raw = localStorage.getItem(AVAIL_PREFIX + eventId)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as AvailabilityMap
  } catch {
    return {}
  }
}
