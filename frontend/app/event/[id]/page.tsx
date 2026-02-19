"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { EventProvider } from "@/lib/event-context"
import { loadEvent, loadEventAPI, type MeetEvent } from "@/lib/types"
import { EventContent } from "@/components/event-content"
import { CalendarDays } from "lucide-react"

export default function EventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [event, setEvent] = useState<MeetEvent | null | "loading">("loading")

  useEffect(() => {
    async function fetchEvent() {
      // Try the database first, fall back to localStorage
      const fromAPI = await loadEventAPI(id)
      if (fromAPI) {
        setEvent(fromAPI)
      } else {
        setEvent(loadEvent(id))
      }
    }
    fetchEvent()
  }, [id])

  if (event === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CalendarDays className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-foreground">Event Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This event doesn{"'"}t exist or the link may have expired.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Create a New Event
        </button>
      </div>
    )
  }

  return (
    <EventProvider event={event}>
      <EventContent />
    </EventProvider>
  )
}
