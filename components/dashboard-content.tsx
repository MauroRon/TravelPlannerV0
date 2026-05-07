'use client'

import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  LogOut, 
  MapPin, 
  Plane, 
  Plus, 
  Briefcase, 
  Globe,
  RefreshCw,
  Clock,
  User
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { it } from 'date-fns/locale'
import type { User } from '@supabase/supabase-js'
import type { Trip, TripMember, TripInvite, Profile } from '@/lib/types'
import { TripCalendar } from '@/components/trip-calendar'
import { TripForm } from '@/components/trip-form'
import { TripDetails } from '@/components/trip-details'
import { ResponsiveModal } from '@/components/responsive-modal'
import { DayTripsView } from '@/components/day-trips-view'
import { PeopleTripsView } from '@/components/people-trips-view'
import { cn } from '@/lib/utils'

interface DashboardContentProps {
  user: User
  profile: Profile | null
}

export function DashboardContent({ user, profile }: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [trips, setTrips] = useState<Trip[]>([])
  const [allTrips, setAllTrips] = useState<Trip[]>([])
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [selectedFormDateRange, setSelectedFormDateRange] = useState<{ from?: Date; to?: Date } | undefined>()
  const [tripMembers, setTripMembers] = useState<TripMember[]>([])
  const [tripInvites, setTripInvites] = useState<TripInvite[]>([])
  const [showNewTripModal, setShowNewTripModal] = useState(false)
  const [showTripDetails, setShowTripDetails] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [showDayTrips, setShowDayTrips] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [viewTab, setViewTab] = useState<'calendar' | 'people'>('calendar')

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Utente'

  const fetchTrips = useCallback(async () => {
    // Recupera TUTTI i viaggi
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: true })

    if (!error && data) {
      setTrips(data)
    }
    setIsLoading(false)
  }, [supabase])

  const fetchAllTrips = useCallback(async () => {
    // Recupera TUTTI i viaggi per il calendario
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('start_date', { ascending: true })

    if (!error && data) {
      setAllTrips(data)
    }
  }, [supabase])

  const fetchTripMembers = useCallback(async (tripId: string) => {
    // Recupera i members
    const { data: members, error: membersError } = await supabase
      .from('trip_members')
      .select('id, trip_id, user_id, role, status')
      .eq('trip_id', tripId)

    if (membersError) {
      console.error('[v0] fetchTripMembers error:', membersError)
      return
    }

    if (!members || members.length === 0) {
      setTripMembers([])
      return
    }

    // Recupera i profili degli utenti
    const userIds = members.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)

    // Unisci i dati
    const membersWithProfiles = members.map(member => ({
      ...member,
      profiles: profiles?.find(p => p.id === member.user_id) || null
    }))

    setTripMembers(membersWithProfiles)
  }, [supabase])

  const fetchTripInvites = useCallback(async (tripId: string) => {
    const { data } = await supabase
      .from('trip_invites')
      .select('*')
      .eq('trip_id', tripId)

    if (data) {
      setTripInvites(data)
    }
  }, [supabase])

  useEffect(() => {
    fetchTrips()
    fetchAllTrips()

    // Sottoscrizione a cambiamenti real-time su trips (solo se il form non è aperto)
    const tripsSubscription = supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        () => {
          // Non refetcha se il form edit è aperto
          if (!showEditModal) {
            fetchTrips()
            fetchAllTrips()
          }
        }
      )
      .subscribe()

    // Sottoscrizione a cambiamenti real-time su trip_members
    const membersSubscription = supabase
      .channel('trip-members-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_members' },
        () => {
          if (!showEditModal) {
            fetchTrips()
          }
        }
      )
      .subscribe()

    return () => {
      tripsSubscription.unsubscribe()
      membersSubscription.unsubscribe()
    }
  }, [fetchTrips, fetchAllTrips, supabase, showEditModal])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setShowDayTrips(true)
  }

  const handleTripClick = async (trip: Trip) => {
    setSelectedTrip(trip)
    await fetchTripMembers(trip.id)
    await fetchTripInvites(trip.id)
    setShowTripDetails(true)
  }

  const handleCreateTrip = async (data: {
    title: string
    description: string
    destination: string
    start_date: string
    end_date: string
    color: string
    status: 'da_confermare' | 'confermato'
  }) => {
    const { data: newTrip, error } = await supabase
      .from('trips')
      .insert({
        ...data,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    if (newTrip) {
      setTrips((prevTrips) => [...prevTrips, newTrip].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      ))
      setAllTrips((prevTrips) => [...prevTrips, newTrip].sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      ))
    }
    
    setShowNewTripModal(false)
    setSelectedDate(undefined)
    setSelectedFormDateRange(undefined)
  }

  const handleDeleteTrip = async () => {
    if (!selectedTrip) return

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', selectedTrip.id)

    if (error) throw new Error(error.message)

    setTrips((prevTrips) => prevTrips.filter((t) => t.id !== selectedTrip.id))
    setAllTrips((prevTrips) => prevTrips.filter((t) => t.id !== selectedTrip.id))
    setShowTripDetails(false)
    setSelectedTrip(null)
  }

  const handleInvite = async (email: string) => {
    if (!selectedTrip) return

    const { error } = await supabase.from('trip_invites').insert({
      trip_id: selectedTrip.id,
      email,
      invited_by: user.id,
    })

    if (error) {
      if (error.code === '23505') {
        throw new Error('Questo utente è già stato invitato')
      }
      throw new Error(error.message)
    }

    // Aggiorna la lista inviti
    await fetchTripInvites(selectedTrip.id)
  }

  const handleJoinTrip = async () => {
    if (!selectedTrip) return

    const { error } = await supabase.from('trip_members').insert({
      trip_id: selectedTrip.id,
      user_id: user.id,
      role: 'member',
      status: 'accepted',
      joined_at: new Date().toISOString(),
    })

    if (error) {
      if (error.code === '23505') {
        throw new Error('Sei già un partecipante di questo viaggio')
      }
      throw new Error(error.message)
    }

    // Aggiorna la lista membri
    await fetchTripMembers(selectedTrip.id)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTrip) return

    const { error } = await supabase
      .from('trip_members')
      .delete()
      .eq('id', memberId)

    if (error) {
      throw new Error(error.message)
    }

    // Aggiorna la lista membri
    await fetchTripMembers(selectedTrip.id)
  }

  // Calcola statistiche
  const upcomingTrips = trips.filter(
    (trip) => parseISO(trip.end_date) >= new Date()
  )
  
  const nextTrip = upcomingTrips[0]

  const getTripDuration = (trip: Trip) => {
    const start = parseISO(trip.start_date)
    const end = parseISO(trip.end_date)
    return differenceInDays(end, start) + 1
  }

  const getTripStatus = (trip: Trip) => {
    return trip.status === 'confermato' ? 'Confermato' : 'Da confermare'
  }

  const getStatusColor = (status: string, tripColor: string) => {
    switch (status) {
      case 'In corso': return 'bg-green-500'
      case 'Completato': return 'bg-gray-400'
      default: return ''
    }
  }

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">TravelApp</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button 
              onClick={() => setShowNewTripModal(true)} 
              size="sm"
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuovo Viaggio</span>
              <span className="sm:hidden">Nuovo</span>
            </Button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground bg-muted/50">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{displayName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* View Tabs */}
        <div className="flex gap-2">
          <Button 
            variant={viewTab === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewTab('calendar')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
          </Button>
          <Button 
            variant={viewTab === 'people' ? 'default' : 'outline'}
            onClick={() => setViewTab('people')}
          >
            <User className="h-4 w-4 mr-2" />
            Per Persona
          </Button>
        </div>

        {/* Calendario */}
        {viewTab === 'calendar' && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <TripCalendar
                trips={allTrips}
                onDayClick={handleDayClick}
                onTripClick={handleTripClick}
                selectedDateRange={selectedFormDateRange}
              />
            )}
          </>
        )}

        {/* Vista Per Persona */}
        {viewTab === 'people' && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Viaggi per Persona</h2>
            <PeopleTripsView userId={user.id} onTripClick={handleTripClick} />
          </div>
        )}

        {/* Lista Viaggi */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">I Tuoi Viaggi</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Aggiornamento in tempo reale</span>
            </div>
          </div>

          {trips.length === 0 ? (
            <Card className="border-dashed shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plane className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">Nessun viaggio in programma</h3>
                <p className="text-sm text-muted-foreground text-center mt-1 mb-4">
                  Crea il tuo primo viaggio e invita i tuoi amici!
                </p>
                <Button onClick={() => setShowNewTripModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crea viaggio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
                const status = getTripStatus(trip)
                const duration = getTripDuration(trip)
                
                return (
                  <Card
                    key={trip.id}
                    className="cursor-pointer transition-all hover:shadow-md active:scale-[0.99] overflow-hidden shadow-sm"
                    onClick={() => handleTripClick(trip)}
                  >
                    <div className="flex">
                      {/* Colored left border */}
                      <div 
                        className="w-1.5 shrink-0" 
                        style={{ backgroundColor: trip.color }}
                      />
                      <CardContent className="flex-1 p-4">
                        {/* Status badge */}
                        <span 
                          className={cn(
                            'inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 text-white',
                            status === 'Confermato' && 'bg-green-500',
                            status === 'Da confermare' && 'bg-orange-500'
                          )}
                        >
                          {status}
                        </span>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-foreground mb-2 truncate">
                          {trip.title}
                        </h3>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <span>
                            {format(parseISO(trip.start_date), 'd MMM yyyy', { locale: it })} -{' '}
                            {format(parseISO(trip.end_date), 'd MMM yyyy', { locale: it })}
                          </span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{duration} giorn{duration === 1 ? 'o' : 'i'}</span>
                          </div>
                          {trip.destination && (
                            <button 
                              className="flex items-center gap-1 text-sm font-medium hover:underline"
                              style={{ color: trip.color }}
                              onClick={(e) => {
                                e.stopPropagation()
                                // Future: open map
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                              Vedi mappa
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
      </main>

      {/* Modal nuovo viaggio */}
      <ResponsiveModal
        open={showNewTripModal}
        onOpenChange={setShowNewTripModal}
        title="Nuovo viaggio"
        description="Crea un nuovo viaggio e invita i tuoi amici"
      >
        <TripForm
          initialDate={selectedDate}
          onSubmit={handleCreateTrip}
          onCancel={() => setShowNewTripModal(false)}
          onDateRangeChange={setSelectedFormDateRange}
        />
      </ResponsiveModal>

      {/* Modal visualizza viaggi della data */}
      <ResponsiveModal
        open={showDayTrips}
        onOpenChange={setShowDayTrips}
        title="Viaggi del giorno"
      >
        {selectedDate && (
          <DayTripsView
            date={selectedDate}
            trips={trips.filter((trip) => {
              const start = new Date(trip.start_date)
              const end = new Date(trip.end_date)
              const day = new Date(selectedDate)
              day.setHours(0, 0, 0, 0)
              start.setHours(0, 0, 0, 0)
              end.setHours(0, 0, 0, 0)
              return day >= start && day <= end
            })}
            onTripClick={(trip) => {
              setShowDayTrips(false)
              handleTripClick(trip)
            }}
            onClose={() => setShowDayTrips(false)}
          />
        )}
      </ResponsiveModal>
      <ResponsiveModal
        open={showTripDetails}
        onOpenChange={setShowTripDetails}
        title="Dettagli viaggio"
      >
        {selectedTrip && (
          <TripDetails
            trip={selectedTrip}
            members={tripMembers}
            invites={tripInvites}
            isOwner={selectedTrip.created_by === user.id}
            userId={user.id}
            onDelete={handleDeleteTrip}
            onInvite={handleInvite}
            onJoin={handleJoinTrip}
            onRemoveMember={handleRemoveMember}
            onEdit={() => {
              setShowTripDetails(false)
              setShowEditModal(true)
            }}
            onClose={() => {
              setShowTripDetails(false)
              setSelectedTrip(null)
            }}
          />
        )}
      </ResponsiveModal>

      {/* Modal modifica viaggio */}
      <ResponsiveModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        title="Modifica viaggio"
      >
        {selectedTrip && (
          <TripForm
            initialTrip={selectedTrip}
            onSubmit={async (data) => {
              const { error } = await supabase
                .from('trips')
                .update(data)
                .eq('id', selectedTrip.id)

              if (error) throw new Error(error.message)

              setTrips((prevTrips) =>
                prevTrips.map((t) =>
                  t.id === selectedTrip.id ? { ...t, ...data } : t
                )
              )
              setAllTrips((prevTrips) =>
                prevTrips.map((t) =>
                  t.id === selectedTrip.id ? { ...t, ...data } : t
                )
              )
              
              setShowEditModal(false)
              setSelectedTrip(null)
              setShowTripDetails(false)
              setSelectedFormDateRange(undefined)
            }}
            onCancel={() => {
              setShowEditModal(false)
              setShowTripDetails(true)
              setSelectedFormDateRange(undefined)
            }}
            onDateRangeChange={setSelectedFormDateRange}
          />
        )}
      </ResponsiveModal>
    </div>
  )
}
