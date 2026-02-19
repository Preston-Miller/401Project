"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreateEvent } from "@/components/create-event"
import { CalendarDays } from "lucide-react"
import { createEventAPI, generateEventId, saveEvent, type DateMode } from "@/lib/types"

export default function Page() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const handleCreated = async (data: {
    name: string
    dateMode: DateMode
    dates: string[]
    startHour: number
    endHour: number
  }) => {
    setCreating(true)
    try {
      // Save to database via backend API
      const event = await createEventAPI(data)
      router.push(`/event/${event.id}`)
    } catch (err) {
      console.error("Backend unavailable, falling back to localStorage:", err)
      // Fallback: save locally so the app still works without the backend
      const id = generateEventId()
      const event = { id, ...data, createdAt: Date.now() }
      saveEvent(event)
      router.push(`/event/${id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CalendarDays className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">MeetSync</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg pt-6 pb-8">
        <CreateEvent onCreated={handleCreated} loading={creating} />
      </main>
    </div>
  )
}
