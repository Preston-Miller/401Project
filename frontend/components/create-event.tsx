"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Clock, Type } from "lucide-react"
import { DAY_NAMES, type DateMode } from "@/lib/types"

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const displayHour = i % 12 === 0 ? 12 : i % 12
  const ampm = i < 12 ? "AM" : "PM"
  return { value: i, label: `${displayHour}:00 ${ampm}` }
})

const DAYS_SHORT: Record<string, string> = {
  Sunday: "Sun",
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
}

interface CreateEventProps {
  onCreated: (data: {
    name: string
    dateMode: DateMode
    dates: string[]
    startHour: number
    endHour: number
  }) => void
  loading?: boolean
}

export function CreateEvent({ onCreated, loading = false }: CreateEventProps) {
  const [name, setName] = useState("")
  const [dateMode, setDateMode] = useState<DateMode>("specific")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(17)

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = () => {
    if (!name.trim() || startHour >= endHour) return

    if (dateMode === "specific") {
      if (selectedDates.length === 0) return
      const isoStrings = selectedDates
        .sort((a, b) => a.getTime() - b.getTime())
        .map((d) => d.toISOString().slice(0, 10))
      onCreated({
        name: name.trim(),
        dateMode,
        dates: isoStrings,
        startHour,
        endHour,
      })
    } else {
      if (selectedDays.length === 0) return
      // Sort days by week order
      const sorted = [...selectedDays].sort(
        (a, b) =>
          DAY_NAMES.indexOf(a as (typeof DAY_NAMES)[number]) -
          DAY_NAMES.indexOf(b as (typeof DAY_NAMES)[number])
      )
      onCreated({
        name: name.trim(),
        dateMode,
        dates: sorted,
        startHour,
        endHour,
      })
    }
  }

  const hasValidDates =
    dateMode === "specific" ? selectedDates.length > 0 : selectedDays.length > 0
  const isValid = name.trim().length > 0 && hasValidDates && startHour < endHour

  return (
    <div className="flex flex-col gap-6 px-4 pb-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl text-balance">
          Create Your Event
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up the details, then share the link for others to mark their
          availability
        </p>
      </div>

      {/* Event Name */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4 text-primary" />
            Event Name
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Team Weekly Sync"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-base"
          />
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-4 w-4 text-primary" />
            When
          </CardTitle>
          <CardDescription>
            Choose specific dates or recurring days of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Mode Toggle */}
          <div className="flex w-full rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setDateMode("specific")}
              className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all ${
                dateMode === "specific"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Specific Dates
            </button>
            <button
              type="button"
              onClick={() => setDateMode("daysOfWeek")}
              className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all ${
                dateMode === "daysOfWeek"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Days of Week
            </button>
          </div>

          {dateMode === "specific" ? (
            <div className="flex flex-col items-center gap-3">
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => setSelectedDates(dates || [])}
                className="rounded-md border border-border"
                disabled={{ before: new Date() }}
              />
              {selectedDates.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedDates.length}{" "}
                  {selectedDates.length === 1 ? "date" : "dates"} selected
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {DAY_NAMES.map((day) => {
                  const isSelected = selectedDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 px-2 py-3 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <span className="text-xs font-semibold">
                        {DAYS_SHORT[day]}
                      </span>
                    </button>
                  )
                })}
              </div>
              {selectedDays.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedDays.length}{" "}
                  {selectedDays.length === 1 ? "day" : "days"} selected
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Range */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Time Range
          </CardTitle>
          <CardDescription>
            Set the earliest and latest possible times
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label
                htmlFor="start-time"
                className="mb-1.5 text-xs text-muted-foreground"
              >
                From
              </Label>
              <select
                id="start-time"
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {timeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="mt-5 text-muted-foreground">to</span>
            <div className="flex-1">
              <Label
                htmlFor="end-time"
                className="mb-1.5 text-xs text-muted-foreground"
              >
                To
              </Label>
              <select
                id="end-time"
                value={endHour}
                onChange={(e) => setEndHour(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {timeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {startHour >= endHour && (
            <p className="mt-2 text-xs text-destructive">
              End time must be after start time
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={!isValid || loading}
        size="lg"
        className="w-full text-base font-semibold"
      >
        {loading ? "Creating…" : "Create Event"}
      </Button>
    </div>
  )
}
