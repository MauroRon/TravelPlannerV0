'use client'

import { useState, useCallback, useEffect } from 'react'
import { signOut, type User } from '@/lib/firebase/auth'
import {
  getTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  getTripMembers,
  getTripInvites,
  createTripInvite,
  addTripMember,
  removeTripMember,
  subscribeToTrips,
  subscribeToTripMembers,
} from '@/lib/firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  LogOut, 
  MapPin, 
  Plane, 
  Plus, 
  RefreshCw,
  Clock,
  User as UserIcon
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { it } from 'date-fns/locale'
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

  const displayName = profile?.display_name || user.displayName || user.email?.split('@')[0] || 'Utente'

  const fetchTrips = useCallback(async () => {
    const data = await getTrips()
    setTrips(data)
    setAllTrips(data)
    setIsLoading(false)
  }, [])

  const fetchTripMembers = useCallback(async (tripId: string) => {
    const members = await getTripMembers(tripId)
    setTripMembers(members)
  }, [])

  const fetchTripInvites = useCallback(async (tripId: string) => {
    const invites = await getTripInvites(tripId)
    setTripInvites(invites)
  }, [])

  useEffect(() => {
    fetchTrips()

    // Subscribe to real-time updates
    const unsubscribeTrips = subscribeToTrips((updatedTrips) => {
      if (!showEditModal) {
        setTrips(updatedTrips)
        setAllTrips(updatedTrips)
      }
    })

    const unsubscribeMembers = subscribeToTripMembers(() => {
      if (!showEditModal) {
        fetchTrips()
      }
    })

    return () => {
      unsubscribeTrips()
      unsubscribeMembers()
    }
  }, [fetchTrips, showEditModal])

  const handleLogout = async () => {
    await signOut()
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
    await createTrip({
      ...data,
      created_by: user.uid,
    })

    // La subscription subscribeToTrips aggiornerà automaticamente lo stato
    setShowNewTripModal(false)
    setSelectedDate(undefined)
    setSelectedFormDateRange(undefined)
  }

  const handleDeleteTrip = async () => {
    if (!selectedTrip) return

    await deleteTrip(selectedTrip.id)

    // La subscription aggiornerà automaticamente lo stato
    setShowTripDetails(false)
    setSelectedTrip(null)
  }

  const handleInvite = async (email: string) => {
    if (!selectedTrip) return

    await createTripInvite({
      trip_id: selectedTrip.id,
      email,
      invited_by: user.uid,
      status: 'pending',
    })

    await fetchTripInvites(selectedTrip.id)
  }

  const handleJoinTrip = async () => {
    if (!selectedTrip) return

    await addTripMember({
      trip_id: selectedTrip.id,
      user_id: user.uid,
      role: 'member',
      status: 'accepted',
      joined_at: new Date().toISOString(),
    })

    await fetchTripMembers(selectedTrip.id)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTrip) return

    await removeTripMember(memberId)
    await fetchTripMembers(selectedTrip.id)
  }

  // Calcola statistiche
  const upcomingTrips = trips.filter(
    (trip) => parseISO(trip.end_date) >= new Date()
  )

  const getTripDuration = (trip: Trip) => {
    const start = parseISO(trip.start_date)
    const end = parseISO(trip.end_date)
    return differenceInDays(end, start) + 1
  }

  const getTripStatus = (trip: Trip) => {
    return trip.status === 'confermato' ? 'Confermato' : 'Da confermare'
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
              <UserIcon className="h-4 w-4 text-muted-foreground" />
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
            <UserIcon className="h-4 w-4 mr-2" />
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
            <PeopleTripsView userId={user.uid} onTripClick={handleTripClick} />
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
            isOwner={selectedTrip.created_by === user.uid}
            userId={user.uid}
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
              await updateTrip(selectedTrip.id, data)

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
