'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthChange, getProfile, type User } from '@/lib/firebase/auth'
import { DashboardContent } from '@/components/dashboard-content'
import type { Profile } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      if (!authUser) {
        router.push('/auth/login')
        return
      }
      
      setUser(authUser)
      
      // Fetch profile
      const userProfile = await getProfile(authUser.uid)
      setProfile(userProfile as Profile | null)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <DashboardContent user={user} profile={profile} />
}
