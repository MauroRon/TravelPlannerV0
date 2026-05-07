'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DateRange } from 'react-day-picker'
import type { Trip } from '@/lib/types'

const TRIP_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

interface TripFormProps {
  initialDate?: Date
  initialTrip?: Trip
  onSubmit: (data: {
    title: string
    description: string
    destination: string
    start_date: string
    end_date: string
    color: string
    status: 'da_confermare' | 'confermato'
  }) => Promise<void>
  onCancel: () => void
  onDateRangeChange?: (dateRange: DateRange | undefined) => void
}

export function TripForm({ initialDate, initialTrip, onSubmit, onCancel, onDateRangeChange }: TripFormProps) {
  const [title, setTitle] = useState(initialTrip?.title || '')
  const [description, setDescription] = useState(initialTrip?.description || '')
  const [destination, setDestination] = useState(initialTrip?.destination || '')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [isSelectingRange, setIsSelectingRange] = useState(false)
  const [color, setColor] = useState(initialTrip?.color || TRIP_COLORS[0])
  const [status, setStatus] = useState<'da_confermare' | 'confermato'>(initialTrip?.status || 'da_confermare')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialTrip) {
      setDateRange({
        from: parseISO(initialTrip.start_date),
        to: parseISO(initialTrip.end_date),
      })
    } else if (initialDate) {
      setDateRange({
        from: initialDate,
        to: initialDate,
      })
    }
  }, [initialTrip, initialDate])

  useEffect(() => {
    onDateRangeChange?.(dateRange)
  }, [dateRange, onDateRangeChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Inserisci un titolo per il viaggio')
      return
    }

    if (!dateRange?.from || !dateRange?.to) {
      setError('Seleziona le date del viaggio')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        destination: destination.trim(),
        start_date: format(dateRange.from, 'yyyy-MM-dd'),
        end_date: format(dateRange.to, 'yyyy-MM-dd'),
        color,
        status,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la creazione')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Titolo *</Label>
        <Input
          id="title"
          name="title"
          placeholder="es. Weekend a Roma"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          tabIndex={1}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="destination">Destinazione</Label>
        <Input
          id="destination"
          name="destination"
          placeholder="es. Roma, Italia"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          tabIndex={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Date del viaggio *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              tabIndex={3}
              className={cn(
                'w-full justify-start text-left font-normal',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'd MMM', { locale: it })} -{' '}
                    {format(dateRange.to, 'd MMM yyyy', { locale: it })}
                  </>
                ) : (
                  format(dateRange.from, 'd MMMM yyyy', { locale: it })
                )
              ) : (
                'Seleziona le date'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              defaultMonth={dateRange?.from}
              selected={undefined}
              onSelect={(date) => {
                if (!date) return
                
                // Se non c'è range o c'è un range completo, inizia nuova selezione
                if (!dateRange?.from || (dateRange?.from && dateRange?.to)) {
                  setDateRange({ from: date, to: undefined })
                  setIsSelectingRange(true)
                } else {
                  // Secondo click: completa il range
                  const dates = [dateRange.from, date].sort((a, b) => a.getTime() - b.getTime())
                  setDateRange({ from: dates[0], to: dates[1] })
                  setIsSelectingRange(false)
                }
              }}
              modifiers={{
                selected: dateRange?.from ? [dateRange.from, dateRange.to].filter(Boolean) as Date[] : [],
                range_middle: dateRange?.from && dateRange?.to ? {
                  after: dateRange.from,
                  before: dateRange.to
                } : undefined,
              }}
              modifiersStyles={{
                selected: { backgroundColor: '#2563eb', color: 'white', borderRadius: '9999px' },
                range_middle: { backgroundColor: '#dbeafe', borderRadius: '0' },
              }}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Aggiungi dettagli sul viaggio..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          tabIndex={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Stato del viaggio</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as 'da_confermare' | 'confermato')}>
          <SelectTrigger id="status" tabIndex={5}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="da_confermare">Da confermare</SelectItem>
            <SelectItem value="confermato">Confermato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Colore</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scegli colore">
          {TRIP_COLORS.map((c, idx) => (
            <button
              key={c}
              type="button"
              tabIndex={5 + idx}
              onClick={() => setColor(c)}
              className={cn(
                'h-8 w-8 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                color === c && 'ring-2 ring-offset-2 ring-primary'
              )}
              style={{ backgroundColor: c }}
              aria-label={`Colore ${idx + 1}`}
              aria-pressed={color === c}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
          tabIndex={13}
        >
          Annulla
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting} tabIndex={14}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialTrip ? 'Salvataggio...' : 'Creazione...'}
            </>
          ) : (
            initialTrip ? 'Salva modifiche' : 'Crea viaggio'
          )}
        </Button>
      </div>
    </form>
  )
}
