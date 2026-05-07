export interface Trip {
  id: string
  title: string
  description: string | null
  destination: string | null
  start_date: string
  end_date: string
  color: string
  status: 'da_confermare' | 'confermato'
  created_by: string
  created_at: string
  updated_at: string
}

export interface TripMember {
  id: string
  trip_id: string
  user_id: string
  role: 'owner' | 'member'
  invited_at: string
  joined_at: string | null
  status: 'pending' | 'accepted' | 'declined'
  profiles?: {
    display_name: string | null
  }
}

export interface TripInvite {
  id: string
  trip_id: string
  email: string
  invited_by: string
  created_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}
