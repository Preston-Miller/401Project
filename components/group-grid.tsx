"use client"

import { useState } from "react"
import { useEvent } from "@/lib/event-context"
import { generateTimeSlots, formatDateShort } from "@/lib/types"
import { cn } from "@/lib/utils"

export function GroupGrid() {
  const { event, participants, getGroupCount, getAvailableNames } = useEvent()
  const [hoveredCell, setHoveredCell] = useState<{
    date: string
    slotIndex: number
  } | null>(null)

  const timeSlots = generateTimeSlots(event.startHour, event.endHour)
  const totalParticipants = participants.length

  if (totalParticipants === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">No responses yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Share the link so others can mark their availability
        </p>
      </div>
    )
  }

  // Find the max availability for "best time" highlighting
  let maxCount = 0
  for (const date of event.dates) {
    for (let i = 0; i < timeSlots.length; i++) {
      const count = getGroupCount(date, i)
      if (count > maxCount) maxCount = count
    }
  }

  const getCellColor = (count: number) => {
    if (count === 0) return "bg-card"
    const ratio = count / totalParticipants
    if (ratio <= 0.25) return "bg-primary/20"
    if (ratio <= 0.5) return "bg-primary/40"
    if (ratio <= 0.75) return "bg-primary/60"
    return "bg-primary/90"
  }

  const hoveredNames = hoveredCell
    ? getAvailableNames(hoveredCell.date, hoveredCell.slotIndex)
    : null

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">0/{totalParticipants}</span>
          <div className="flex gap-0.5">
            <div className="h-4 w-4 rounded-sm border border-border bg-card" />
            <div className="h-4 w-4 rounded-sm bg-primary/20" />
            <div className="h-4 w-4 rounded-sm bg-primary/40" />
            <div className="h-4 w-4 rounded-sm bg-primary/60" />
            <div className="h-4 w-4 rounded-sm bg-primary/90" />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {totalParticipants}/{totalParticipants}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">Hover to see who</span>
      </div>

      {/* Tooltip */}
      {hoveredCell && hoveredNames && (
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-sm">
          <span className="font-medium text-foreground">
            {hoveredNames.length}/{totalParticipants} available
          </span>
          {hoveredNames.length > 0 && (
            <span className="ml-2 text-muted-foreground">{hoveredNames.join(", ")}</span>
          )}
        </div>
      )}

      {/* Grid */}
      <div
        className="no-select overflow-x-auto rounded-lg border border-border bg-card"
        style={{ touchAction: "pan-x" }}
      >
        <div className="inline-flex min-w-full flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 flex border-b border-border bg-card">
            <div className="flex w-16 shrink-0 items-center justify-center border-r border-border sm:w-20">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Time
              </span>
            </div>
            {event.dates.map((date) => {
              const { dayName, monthDay } = formatDateShort(date, event.dateMode)
              return (
                <div
                  key={date}
                  className="flex w-14 shrink-0 flex-col items-center justify-center py-2 sm:w-16"
                >
                  {monthDay && (
                    <span className="text-[10px] text-muted-foreground">{monthDay}</span>
                  )}
                  <span className="text-xs font-semibold text-foreground">{dayName}</span>
                </div>
              )
            })}
          </div>

          {/* Body */}
          {timeSlots.map((label, slotIndex) => (
            <div key={slotIndex} className="flex">
              <div className="flex h-10 w-16 shrink-0 items-center justify-end border-r border-border pr-2 sm:h-11 sm:w-20 sm:pr-3">
                {slotIndex % 2 === 0 && (
                  <span className="text-[10px] text-muted-foreground sm:text-xs">{label}</span>
                )}
              </div>
              {event.dates.map((date) => {
                const count = getGroupCount(date, slotIndex)
                const isBest = count === maxCount && maxCount > 0
                return (
                  <div
                    key={`${date}-${slotIndex}`}
                    onMouseEnter={() => setHoveredCell({ date, slotIndex })}
                    onTouchStart={() => setHoveredCell({ date, slotIndex })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={cn(
                      "flex h-10 w-14 shrink-0 items-center justify-center border-b border-r transition-colors sm:h-11 sm:w-16",
                      slotIndex % 2 === 0 ? "border-border" : "border-border/50",
                      getCellColor(count),
                      isBest && "ring-1 ring-inset ring-primary"
                    )}
                  >
                    {count > 0 && (
                      <span
                        className={cn(
                          "text-[10px] font-semibold",
                          count / totalParticipants > 0.5
                            ? "text-primary-foreground"
                            : "text-primary"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
