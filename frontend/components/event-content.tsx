"use client"

import React from "react"

import { useState } from "react"
import { useEvent } from "@/lib/event-context"
import { formatDateShort } from "@/lib/types"
import { AvailabilityGrid } from "@/components/availability-grid"
import { GroupGrid } from "@/components/group-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CalendarDays,
  Check,
  Copy,
  Link2,
  User,
  Users,
} from "lucide-react"

type ViewMode = "mine" | "group"

function UsernameEntry() {
  const { setUsername } = useEvent()
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      setUsername(name.trim())
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <User className="h-7 w-7 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">
          {"What's"} your name?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a name so others can see who responded
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs gap-2">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-base"
          autoFocus
        />
        <Button type="submit" disabled={!name.trim()}>
          Join
        </Button>
      </form>
    </div>
  )
}

function ViewToggle({
  mode,
  onModeChange,
}: {
  mode: ViewMode
  onModeChange: (mode: ViewMode) => void
}) {
  return (
    <div className="flex w-full rounded-lg bg-muted p-1">
      <button
        type="button"
        onClick={() => onModeChange("mine")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
          mode === "mine"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <User className="h-4 w-4" />
        My Availability
      </button>
      <button
        type="button"
        onClick={() => onModeChange("group")}
        className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
          mode === "group"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Users className="h-4 w-4" />
        Group Availability
      </button>
    </div>
  )
}

function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input")
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-primary" />
          <span className="text-primary">Copied</span>
        </>
      ) : (
        <>
          <Link2 className="h-3.5 w-3.5" />
          Share Link
        </>
      )}
    </button>
  )
}

export function EventContent() {
  const { event, username, participants } = useEvent()
  const [viewMode, setViewMode] = useState<ViewMode>("mine")

  // Format the date summary
  const dateSummary =
    event.dateMode === "daysOfWeek"
      ? event.dates.join("  ·  ")
      : event.dates
          .map((d) => {
            const { dayName, monthDay } = formatDateShort(d)
            return `${dayName}, ${monthDay}`
          })
          .join("  ·  ")

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CalendarDays className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">MeetSync</span>
          </div>
          <ShareButton />
        </div>
      </header>

      {/* Event info */}
      <div className="mx-auto max-w-lg px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl text-balance">
          {event.name}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">{dateSummary}</p>

        {/* Participant badges */}
        {participants.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {participants.length} {participants.length === 1 ? "response" : "responses"}:
            </span>
            {participants.map((p) => (
              <span
                key={p}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  p === username
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="mx-auto max-w-lg px-4 pb-8">
        {!username ? (
          <UsernameEntry />
        ) : (
          <div className="flex flex-col gap-4 pt-2">
            {/* Toggle */}
            <ViewToggle mode={viewMode} onModeChange={setViewMode} />

            {/* Signed-in banner */}
            <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
              <Copy className="h-3.5 w-3.5" />
              Signed in as <span className="font-semibold">{username}</span>
            </div>

            {/* Grid */}
            {viewMode === "mine" ? <AvailabilityGrid /> : <GroupGrid />}
          </div>
        )}
      </main>
    </div>
  )
}
