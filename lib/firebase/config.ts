import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Check if Firebase config is available
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

if (isConfigValid) {
  // Initialize Firebase (avoid reinitializing in dev mode with hot reload)
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  auth = getAuth(app)
  db = getFirestore(app)
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error('Firebase non è configurato. Verifica le variabili d\'ambiente.')
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error('Firebase Auth non è configurato. Verifica le variabili d\'ambiente.')
  }
  return auth
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    throw new Error('Firestore non è configurato. Verifica le variabili d\'ambiente.')
  }
  return db
}

export { app, auth, db }
