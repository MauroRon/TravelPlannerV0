'use client'

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import { getFirebaseDb } from './config'
import type { Trip, TripMember, TripInvite, Profile } from '@/lib/types'

// Trips
export async function getTrips(): Promise<Trip[]> {
  const db = getFirebaseDb()
  const q = query(collection(db, 'trips'), orderBy('start_date', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trip))
}

export async function createTrip(tripData: Omit<Trip, 'id' | 'created_at'>): Promise<Trip> {
  const db = getFirebaseDb()
  const docRef = await addDoc(collection(db, 'trips'), {
    ...tripData,
    created_at: new Date().toISOString(),
  })
  
  // Aggiungi automaticamente il creatore come membro owner
  await addDoc(collection(db, 'trip_members'), {
    trip_id: docRef.id,
    user_id: tripData.created_by,
    role: 'owner',
    status: 'accepted',
    joined_at: new Date().toISOString(),
  })
  
  return { id: docRef.id, ...tripData, created_at: new Date().toISOString() } as Trip
}

export async function updateTrip(tripId: string, data: Partial<Trip>): Promise<void> {
  const db = getFirebaseDb()
  const docRef = doc(db, 'trips', tripId)
  await updateDoc(docRef, data)
}

export async function deleteTrip(tripId: string): Promise<void> {
  const db = getFirebaseDb()
  await deleteDoc(doc(db, 'trips', tripId))
}

export function subscribeToTrips(callback: (trips: Trip[]) => void): Unsubscribe {
  const db = getFirebaseDb()
  const q = query(collection(db, 'trips'), orderBy('start_date', 'asc'))
  return onSnapshot(q, (snapshot) => {
    const trips = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Trip))
    callback(trips)
  })
}

// Trip Members
export async function getTripMembers(tripId: string): Promise<TripMember[]> {
  const db = getFirebaseDb()
  const q = query(collection(db, 'trip_members'), where('trip_id', '==', tripId))
  const snapshot = await getDocs(q)
  const members = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TripMember))
  
  // Fetch profiles for members
  const membersWithProfiles = await Promise.all(
    members.map(async (member) => {
      const profileDoc = await getDoc(doc(db, 'profiles', member.user_id))
      return {
        ...member,
        profiles: profileDoc.exists() ? profileDoc.data() as Profile : null
      }
    })
  )
  
  return membersWithProfiles
}

export async function addTripMember(data: Omit<TripMember, 'id'>): Promise<void> {
  const db = getFirebaseDb()
  // Check if already a member
  const q = query(
    collection(db, 'trip_members'), 
    where('trip_id', '==', data.trip_id),
    where('user_id', '==', data.user_id)
  )
  const existing = await getDocs(q)
  if (!existing.empty) {
    throw new Error('Sei già un partecipante di questo viaggio')
  }
  
  await addDoc(collection(db, 'trip_members'), data)
}

export async function removeTripMember(memberId: string): Promise<void> {
  const db = getFirebaseDb()
  await deleteDoc(doc(db, 'trip_members', memberId))
}

export function subscribeToTripMembers(callback: () => void): Unsubscribe {
  const db = getFirebaseDb()
  return onSnapshot(collection(db, 'trip_members'), callback)
}

// Trip Invites
export async function getTripInvites(tripId: string): Promise<TripInvite[]> {
  const db = getFirebaseDb()
  const q = query(collection(db, 'trip_invites'), where('trip_id', '==', tripId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TripInvite))
}

export async function createTripInvite(data: Omit<TripInvite, 'id' | 'created_at'>): Promise<void> {
  const db = getFirebaseDb()
  // Check if already invited
  const q = query(
    collection(db, 'trip_invites'), 
    where('trip_id', '==', data.trip_id),
    where('email', '==', data.email)
  )
  const existing = await getDocs(q)
  if (!existing.empty) {
    throw new Error('Questo utente è già stato invitato')
  }
  
  await addDoc(collection(db, 'trip_invites'), {
    ...data,
    created_at: new Date().toISOString(),
  })
}

// Profiles
export async function getAllProfiles(): Promise<Profile[]> {
  const db = getFirebaseDb()
  const snapshot = await getDocs(collection(db, 'profiles'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Profile))
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const db = getFirebaseDb()
  const docSnap = await getDoc(doc(db, 'profiles', userId))
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Profile : null
}

// Recupera tutti i membri di tutti i viaggi, con profili, raggruppati per trip_id
export async function getAllTripMembersWithProfiles(): Promise<Record<string, TripMember[]>> {
  const db = getFirebaseDb()
  const profiles = await getAllProfiles()
  const membersSnapshot = await getDocs(collection(db, 'trip_members'))
  const members = membersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as TripMember))

  const grouped: Record<string, TripMember[]> = {}
  members.forEach((member) => {
    const profile = profiles.find(p => p.id === member.user_id) || null
    const memberWithProfile = { ...member, profiles: profile }
    if (!grouped[member.trip_id]) {
      grouped[member.trip_id] = []
    }
    grouped[member.trip_id].push(memberWithProfile)
  })

  return grouped
}

// Get all trips with members for people view
export async function getTripsGroupedByPerson(): Promise<{
  personName: string
  personId: string
  trips: Trip[]
}[]> {
  const db = getFirebaseDb()
  const profiles = await getAllProfiles()
  const trips = await getTrips()
  
  const membersQuery = query(
    collection(db, 'trip_members'),
    where('status', '==', 'accepted')
  )
  const membersSnapshot = await getDocs(membersQuery)
  const members = membersSnapshot.docs.map(d => d.data())
  
  const groupedByPerson = new Map<string, { personName: string; personId: string; trips: Trip[] }>()
  
  members.forEach(member => {
    const profile = profiles.find(p => p.id === member.user_id)
    const personName = profile?.display_name || `Utente ${member.user_id.substring(0, 8)}`
    const personId = member.user_id
    
    if (!groupedByPerson.has(personId)) {
      groupedByPerson.set(personId, { personName, personId, trips: [] })
    }
    
    const trip = trips.find(t => t.id === member.trip_id)
    if (trip) {
      groupedByPerson.get(personId)!.trips.push(trip)
    }
  })
  
  return Array.from(groupedByPerson.values()).sort((a, b) =>
    a.personName.localeCompare(b.personName)
  )
}
