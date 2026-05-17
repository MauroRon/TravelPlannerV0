'use client'

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirebaseDb } from './config'

const googleProvider = new GoogleAuthProvider()

export type { User }

export async function signIn(email: string, password: string) {
  const auth = getFirebaseAuth()
  const result = await signInWithEmailAndPassword(auth, email, password)
  return result.user
}

export async function signUp(email: string, password: string, displayName: string) {
  const auth = getFirebaseAuth()
  const db = getFirebaseDb()
  const result = await createUserWithEmailAndPassword(auth, email, password)
  
  // Update profile with display name
  await updateProfile(result.user, { displayName })
  
  // Create user profile in Firestore
  await setDoc(doc(db, 'profiles', result.user.uid), {
    id: result.user.uid,
    display_name: displayName,
    email: email,
    created_at: new Date().toISOString(),
  })
  
  return result.user
}

export async function signOut() {
  const auth = getFirebaseAuth()
  return firebaseSignOut(auth)
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth()
  const db = getFirebaseDb()
  const result = await signInWithPopup(auth, googleProvider)
  
  // Check if user profile exists, if not create it
  const profileRef = doc(db, 'profiles', result.user.uid)
  const profileSnap = await getDoc(profileRef)
  
  if (!profileSnap.exists()) {
    await setDoc(profileRef, {
      id: result.user.uid,
      display_name: result.user.displayName || 'Utente',
      email: result.user.email,
      avatar_url: result.user.photoURL,
      created_at: new Date().toISOString(),
    })
  }
  
  return result.user
}

export function onAuthChange(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth()
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth()
  return auth.currentUser
}

export async function getProfile(userId: string) {
  const db = getFirebaseDb()
  const docRef = doc(db, 'profiles', userId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}
