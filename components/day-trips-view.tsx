'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, MapPin, Clock, ChevronLeft } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { it } from 'date-fns/locale'
import type { Trip } from '@/lib/types'
import { cn } from '@/lib/utils'

interface DayTripsViewProps {
  date: Date
  trips: Trip[]
  onTripClick: (trip: Trip) => void
  onClose: () => void
}

export function DayTripsView({ date, trips, onTripClick, onClose }: DayTripsViewProps) {
  const getTripDuration = (trip: Trip) => {
    const start = parseISO(trip.start_date)
    const end = parseISO(trip.end_date)
    return differenceInDays(end, start) + 1
  }

  const getTripStatus = (trip: Trip) => {
    // Usa lo stato del viaggio confermato/da_confermare
    return trip.status === 'confermato' ? 'Confermato' : 'Da confermare'
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 text-center">
          <p className="text-xs text-muted-foreground">Viaggi del</p>
          <p className="text-sm font-semibold">
            {format(date, 'd MMMM', { locale: it })}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-8 px-3 text-xs"
        >
          Esci
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 flex-1">
          <Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Nessun viaggio in questa data</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3">
          {trips.map((trip) => {
            const status = getTripStatus(trip)
            const duration = getTripDuration(trip)

            return (
              <Card
                key={trip.id}
                className="cursor-pointer transition-all hover:shadow-md active:scale-[0.99] overflow-hidden shadow-sm"
                onClick={() => onTripClick(trip)}
              >
                <div className="flex">
                  <div 
                    className="w-1.5 shrink-0" 
                    style={{ backgroundColor: trip.color }}
                  />
                  <CardContent className="flex-1 p-3">
                    <span 
                      className={cn(
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 text-white',
                        status === 'Confermato' && 'bg-green-500',
                        status === 'Da confermare' && 'bg-orange-500'
                      )}
                    >
                      {status}
                    </span>

                    <h3 className="font-semibold text-foreground mb-1 truncate">
                      {trip.title}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>
                        {format(parseISO(trip.start_date), 'd MMM', { locale: it })} -{' '}
                        {format(parseISO(trip.end_date), 'd MMM', { locale: it })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{duration} giorn{duration === 1 ? 'o' : 'i'}</span>
                      </div>
                      {trip.destination && (
                        <button 
                          className="flex items-center gap-1 text-xs font-medium hover:underline"
                          style={{ color: trip.color }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MapPin className="h-3 w-3" />
                          <span className="hidden sm:inline">Mappa</span>
                        </button>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
