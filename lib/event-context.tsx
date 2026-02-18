"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type { MeetEvent, AvailabilityMap } from "./types"
import { saveAvailability, loadAvailability } from "./types"

interface EventContextType {
  event: MeetEvent
  username: string | null
  availability: AvailabilityMap
  participants: string[]
  setUsername: (name: string) => void
  setSlots: (slots: { date: string; slotIndex: number; value: boolean }[]) => void
  getGroupCount: (date: string, slotIndex: number) => number
  getAvailableNames: (date: string, slotIndex: number) => string[]
}

const EventContext = createContext<EventContextType | null>(null)

export function useEvent() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error("useEvent must be used within EventProvider")
  return ctx
}

export function EventProvider({
  event,
  children,
}: {
  event: MeetEvent
  children: ReactNode
}) {
  const [availability, setAvailability] = useState<AvailabilityMap>({})
  const [username, setUsernameState] = useState<string | null>(null)

  // Load availability and stored username from localStorage on mount
  useEffect(() => {
    const loaded = loadAvailability(event.id)
    setAvailability(loaded)

    const storedName = localStorage.getItem(`meetsync:user:${event.id}`)
    if (storedName) {
      setUsernameState(storedName)
    }
  }, [event.id])

  const setUsername = useCallback(
    (name: string) => {
      setUsernameState(name)
      localStorage.setItem(`meetsync:user:${event.id}`, name)

      // Initialize availability for this user if they don't have any yet
      setAvailability((prev) => {
        if (prev[name]) return prev
        const slotCount = (event.endHour - event.startHour) * 2
        const userAvail: Record<string, boolean[]> = {}
        for (const d of event.dates) {
          userAvail[d] = new Array(slotCount).fill(false)
        }
        const next = { ...prev, [name]: userAvail }
        saveAvailability(event.id, next)
        return next
      })
    },
    [event]
  )

  const setSlots = useCallback(
    (slots: { date: string; slotIndex: number; value: boolean }[]) => {
      if (!username) return
      setAvailability((prev) => {
        const next = { ...prev }
        const personSlots = { ...next[username] }

        for (const { date, slotIndex, value } of slots) {
          if (!personSlots[date]) continue
          const daySlots = [...personSlots[date]]
          daySlots[slotIndex] = value
          personSlots[date] = daySlots
        }

        next[username] = personSlots
        saveAvailability(event.id, next)
        return next
      })
    },
    [username, event.id]
  )

  const participants = Object.keys(availability)

  const getGroupCount = useCallback(
    (date: string, slotIndex: number): number => {
      let count = 0
      for (const p of Object.keys(availability)) {
        if (availability[p]?.[date]?.[slotIndex]) {
          count++
        }
      }
      return count
    },
    [availability]
  )

  const getAvailableNames = useCallback(
    (date: string, slotIndex: number): string[] => {
      return Object.keys(availability).filter(
        (p) => availability[p]?.[date]?.[slotIndex]
      )
    },
    [availability]
  )

  return (
    <EventContext.Provider
      value={{
        event,
        username,
        availability,
        participants,
        setUsername,
        setSlots,
        getGroupCount,
        getAvailableNames,
      }}
    >
      {children}
    </EventContext.Provider>
  )
}
