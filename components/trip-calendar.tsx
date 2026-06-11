'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  differenceInDays,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Trip } from '@/lib/types'
import type { DateRange } from 'react-day-picker'

interface TripCalendarProps {
  trips: Trip[]
  onDayClick: (date: Date) => void
  onTripClick: (trip: Trip) => void
  selectedDateRange?: DateRange
}

interface TripBar {
  trip: Trip
  startCol: number
  endCol: number
  row: number
}

export function TripCalendar({ trips, onDayClick, onTripClick, selectedDateRange }: TripCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const goToToday = () => setCurrentMonth(new Date())

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Raggruppa i giorni per settimana
  const weeks = useMemo(() => {
    const result: Date[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  // Calcola le barre dei viaggi per ogni settimana
  const getTripBarsForWeek = (weekDays: Date[]): TripBar[] => {
    const bars: TripBar[] = []
    const usedRows: Map<string, number> = new Map()

    trips.forEach((trip) => {
      const tripStart = parseISO(trip.start_date)
      const tripEnd = parseISO(trip.end_date)

      // Trova i giorni della settimana che si sovrappongono con il viaggio
      let startCol = -1
      let endCol = -1

      weekDays.forEach((day, idx) => {
        const isInTrip = isWithinInterval(day, { start: tripStart, end: tripEnd }) ||
          isSameDay(day, tripStart) || isSameDay(day, tripEnd)
        
        if (isInTrip) {
          if (startCol === -1) startCol = idx
          endCol = idx
        }
      })

      if (startCol !== -1) {
        // Trova una riga libera per questo viaggio
        let row = 0
        const tripKey = trip.id
        
        // Controlla se questo viaggio ha già una riga assegnata
        if (usedRows.has(tripKey)) {
          row = usedRows.get(tripKey)!
        } else {
          // Trova la prima riga libera
          const usedRowsInRange: Set<number> = new Set()
          bars.forEach((bar) => {
            // Se c'è sovrapposizione orizzontale
            if (!(bar.endCol < startCol || bar.startCol > endCol)) {
              usedRowsInRange.add(bar.row)
            }
          })
          while (usedRowsInRange.has(row)) row++
          usedRows.set(tripKey, row)
        }

        bars.push({ trip, startCol, endCol, row })
      }
    })

    return bars.sort((a, b) => a.row - b.row)
  }

  const getTripsForDay = (day: Date) => {
    return trips.filter((trip) => {
      const start = parseISO(trip.start_date)
      const end = parseISO(trip.end_date)
      return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end)
    })
  }

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b">
        <div className="flex items-center gap-2 text-foreground">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-base sm:text-lg font-semibold">Calendario</h2>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-primary font-medium px-2 h-8"
          >
            Oggi
          </Button>
          <span className="text-sm sm:text-base font-medium capitalize min-w-[100px] sm:min-w-[130px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: it })}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar weeks with trip bars */}
      <div className="divide-y">
        {weeks.map((week, weekIdx) => {
          const tripBars = getTripBarsForWeek(week)
          const maxRow = tripBars.length > 0 ? Math.max(...tripBars.map(b => b.row)) + 1 : 0
          
          return (
            <div key={weekIdx} className="relative">
              {/* Day numbers row */}
              <div className="grid grid-cols-7">
                {week.map((day, dayIdx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth)
                  const isToday = isSameDay(day, new Date())
                  const dayTrips = getTripsForDay(day)
                  const isInSelectedRange = selectedDateRange?.from && selectedDateRange?.to && 
                    isWithinInterval(day, { start: selectedDateRange.from, end: selectedDateRange.to })
                  const isStartDate = selectedDateRange?.from && isSameDay(day, selectedDateRange.from)
                  const isEndDate = selectedDateRange?.to && isSameDay(day, selectedDateRange.to)

                  return (
                    <button
                      key={dayIdx}
                      onClick={() => onDayClick(day)}
                      className={cn(
                        'relative flex flex-col items-center py-2 transition-colors',
                        'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                        !isCurrentMonth && 'text-muted-foreground/50',
                        isInSelectedRange && 'bg-primary/10',
                        dayIdx < 6 && 'border-r border-border/50'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-sm font-medium',
                          isToday && 'bg-primary/10 text-primary ring-2 ring-primary',
                          (isStartDate || isEndDate) && 'bg-primary text-white'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {/* Dots indicator for mobile */}
                      {dayTrips.length > 0 && (
                        <div className="flex gap-0.5 mt-1">
                          {dayTrips.slice(0, 3).map((trip, i) => (
                            <span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: trip.color }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Trip bars - hidden on very small screens, shown as dots instead */}
              {tripBars.length > 0 && (
                <div 
                  className="hidden sm:block relative px-1 pb-2"
                  style={{ minHeight: maxRow * 28 + 4 }}
                >
                  {tripBars.map((bar, barIdx) => {
                    const width = ((bar.endCol - bar.startCol + 1) / 7) * 100
                    const left = (bar.startCol / 7) * 100
                    
                    return (
                      <button
                        key={barIdx}
                        onClick={(e) => {
                          e.stopPropagation()
                          onTripClick(bar.trip)
                        }}
                        className="absolute h-6 rounded-md flex items-center px-2 text-white text-xs font-medium truncate transition-all hover:opacity-90 hover:shadow-md"
                        style={{
                          backgroundColor: bar.trip.color,
                          left: `calc(${left}% + 2px)`,
                          width: `calc(${width}% - 4px)`,
                          top: bar.row * 28 + 2,
                        }}
                      >
                        <span className="truncate">{bar.trip.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
