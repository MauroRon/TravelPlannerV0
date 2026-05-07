'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Trip } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'

interface PersonTrips {
  personName: string
  personId: string
  trips: Trip[]
}

interface PeopleTripsViewProps {
  userId: string
  onTripClick: (trip: Trip) => void
}

export function PeopleTripsView({ userId, onTripClick }: PeopleTripsViewProps) {
  const supabase = createClient()
  const [peopleTrips, setPeopleTrips] = useState<PersonTrips[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchPeopleTrips = useCallback(async () => {
    setIsLoading(true)
    try {
      // Recupera TUTTI gli utenti
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')

      if (profilesError) {
        console.error('[v0] Error fetching profiles:', profilesError)
        setIsLoading(false)
        return
      }

      if (!allProfiles || allProfiles.length === 0) {
        setPeopleTrips([])
        setIsLoading(false)
        return
      }

      // Recupera TUTTI i viaggi
      const { data: allTrips, error: tripsError } = await supabase
        .from('trips')
        .select('*')

      if (tripsError) {
        console.error('[v0] Error fetching trips:', tripsError)
        setIsLoading(false)
        return
      }

      if (!allTrips || allTrips.length === 0) {
        setPeopleTrips([])
        setIsLoading(false)
        return
      }

      // Recupera TUTTI i membri
      const { data: allMembers, error: membersError } = await supabase
        .from('trip_members')
        .select('id, trip_id, user_id, role, status')
        .eq('status', 'accepted')

      if (membersError) {
        console.error('[v0] Error fetching members:', membersError)
        setIsLoading(false)
        return
      }

      // Raggruppa i viaggi per persona
      const groupedByPerson = new Map<string, PersonTrips>()

      allMembers?.forEach(member => {
        const profile = allProfiles?.find(p => p.id === member.user_id)
        const personName = profile?.display_name || `Utente ${member.user_id.substring(0, 8)}`
        const personId = member.user_id

        if (!groupedByPerson.has(personId)) {
          groupedByPerson.set(personId, {
            personName,
            personId,
            trips: []
          })
        }

        const trip = allTrips?.find(t => t.id === member.trip_id)
        if (trip) {
          groupedByPerson.get(personId)!.trips.push(trip)
        }
      })

      // Converte in array e ordina per nome persona
      const sorted = Array.from(groupedByPerson.values()).sort((a, b) =>
        a.personName.localeCompare(b.personName)
      )

      setPeopleTrips(sorted)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPeopleTrips()
  }, [fetchPeopleTrips])

  if (isLoading) {
    return <div className="text-center py-8">Caricamento...</div>
  }

  if (peopleTrips.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Nessun viaggio trovato</div>
  }

  return (
    <div className="space-y-6">
      {peopleTrips.map(person => (
        <div key={person.personId}>
          <h3 className="font-semibold text-lg mb-3">{person.personName}</h3>
          <div className="space-y-2">
            {person.trips.map(trip => {
              const startDate = parseISO(trip.start_date)
              const endDate = parseISO(trip.end_date)

              return (
                <Card
                  key={trip.id}
                  className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                  onClick={() => onTripClick(trip)}
                >
                  <div className="flex">
                    <div 
                      className="w-1.5 shrink-0" 
                      style={{ backgroundColor: trip.color }}
                    />
                    <CardContent className="flex-1 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{trip.title}</h4>
                          <span 
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                              trip.status === 'confermato' ? 'bg-green-500' : 'bg-orange-500'
                            }`}
                          >
                            {trip.status === 'confermato' ? 'Confermato' : 'Da confermare'}
                          </span>
                        </div>
                        {trip.destination && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{trip.destination}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(startDate, 'd MMM', { locale: it })} - {format(endDate, 'd MMM yyyy', { locale: it })}
                        </p>
                      </div>
                    </div>
                    </CardContent>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
