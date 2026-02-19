"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { useEvent } from "@/lib/event-context"
import { generateTimeSlots, formatDateShort } from "@/lib/types"
import { cn } from "@/lib/utils"

export function AvailabilityGrid() {
  const { event, username, availability, setSlots } = useEvent()
  const gridRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState(false)
  const [draggedCells, setDraggedCells] = useState<Set<string>>(new Set())

  const handlePointerDown = (date: string, slotIndex: number, e: React.PointerEvent) => {
    e.preventDefault()
    if (!username) return
    const currentValue = availability[username]?.[date]?.[slotIndex] ?? false
    const newValue = !currentValue
    setIsDragging(true)
    setDragValue(newValue)
    setDraggedCells(new Set([`${date}-${slotIndex}`]))
    setSlots([{ date, slotIndex, value: newValue }])
  }

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const elements = document.elementsFromPoint(e.clientX, e.clientY)
      for (const el of elements) {
        const cellEl = (el as HTMLElement).closest("[data-cell]") as HTMLElement | null
        if (cellEl) {
          const date = cellEl.dataset.date
          const slot = cellEl.dataset.slot
          if (date && slot !== undefined) {
            const slotIndex = parseInt(slot)
            const key = `${date}-${slotIndex}`
            if (!draggedCells.has(key)) {
              setDraggedCells((prev) => {
                const next = new Set(prev)
                next.add(key)
                return next
              })
              setSlots([{ date, slotIndex, value: dragValue }])
            }
          }
          break
        }
      }
    },
    [isDragging, draggedCells, dragValue, setSlots]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    setDraggedCells(new Set())
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      return () => {
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
      }
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  if (!username) return null

  const timeSlots = generateTimeSlots(event.startHour, event.endHour)
  const userAvailability = availability[username] || {}

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-sm border border-border bg-card" />
          <span className="text-xs text-muted-foreground">Unavailable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-4 rounded-sm bg-primary/80" />
          <span className="text-xs text-muted-foreground">Available</span>
        </div>
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        Click and drag to toggle your availability
      </p>

      <div
        ref={gridRef}
        className="no-select overflow-x-auto rounded-lg border border-border bg-card"
        style={{ touchAction: "none" }}
      >
        <div className="inline-flex min-w-full flex-col">
          {/* Header row */}
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

          {/* Grid body */}
          {timeSlots.map((label, slotIndex) => (
            <div key={slotIndex} className="flex">
              <div className="flex h-10 w-16 shrink-0 items-center justify-end border-r border-border pr-2 sm:h-11 sm:w-20 sm:pr-3">
                {slotIndex % 2 === 0 && (
                  <span className="text-[10px] text-muted-foreground sm:text-xs">{label}</span>
                )}
              </div>

              {event.dates.map((date) => {
                const isAvailable = userAvailability[date]?.[slotIndex] ?? false
                return (
                  <div
                    key={`${date}-${slotIndex}`}
                    data-cell="true"
                    data-date={date}
                    data-slot={slotIndex}
                    onPointerDown={(e) => handlePointerDown(date, slotIndex, e)}
                    className={cn(
                      "flex h-10 w-14 shrink-0 cursor-pointer items-center justify-center border-b border-r transition-colors sm:h-11 sm:w-16",
                      slotIndex % 2 === 0 ? "border-border" : "border-border/50",
                      isAvailable ? "bg-primary/80 hover:bg-primary/90" : "bg-card hover:bg-muted"
                    )}
                  >
                    {isAvailable && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
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
