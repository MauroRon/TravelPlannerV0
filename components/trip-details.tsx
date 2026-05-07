'use client'

import { useState } from 'react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, MapPin, Trash2, UserPlus, Users, Loader2, X, Check, Mail, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Trip, TripMember, TripInvite } from '@/lib/types'

interface TripDetailsProps {
  trip: Trip
  members: TripMember[]
  invites: TripInvite[]
  isOwner: boolean
  userId: string
  onDelete: () => Promise<void>
  onInvite: (email: string) => Promise<void>
  onJoin: () => Promise<void>
  onRemoveMember: (memberId: string) => Promise<void>
  onEdit: () => void
  onClose: () => void
}

export function TripDetails({
  trip,
  members,
  invites,
  isOwner,
  userId,
  onDelete,
  onInvite,
  onJoin,
  onRemoveMember,
  onEdit,
  onClose,
}: TripDetailsProps) {
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Check if user is already a member
  const isUserMember = members.some((m) => m.user_id === userId)

  const startDate = parseISO(trip.start_date)
  const endDate = parseISO(trip.end_date)
  const duration = differenceInDays(endDate, startDate) + 1

  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questo viaggio? L\'azione non può essere annullata.')) {
      return
    }

    setIsDeleting(true)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'eliminazione')
      setIsDeleting(false)
    }
  }

  const handleJoin = async () => {
    setIsJoining(true)
    setError('')
    try {
      await onJoin()
      setSuccessMessage('Ti sei unito al viaggio! 🎉')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'adesione al viaggio')
    } finally {
      setIsJoining(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    // Un utente può rimuovere solo se stesso se non è owner
    if (!isOwner && memberUserId !== userId) {
      setError('Puoi rimuovere solo te stesso dal viaggio')
      return
    }

    setRemovingMemberId(memberId)
    setError('')
    try {
      await onRemoveMember(memberId)
      setSuccessMessage('Partecipante rimosso con successo')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante la rimozione')
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header con colore e pulsante Esci */}
      <div
        className="rounded-lg p-4 text-white flex items-start justify-between"
        style={{ backgroundColor: trip.color }}
      >
        <div>
          <h2 className="text-xl font-bold">{trip.title}</h2>
          {trip.destination && (
            <div className="mt-1 flex items-center gap-1 text-white/90">
              <MapPin className="h-4 w-4" />
              <span>{trip.destination}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 hover:text-white"
        >
          Esci
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200">
          {successMessage}
        </div>
      )}

      {/* Contenuto scrollabile */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">

      {/* Date */}
      <div className="flex items-start gap-3 rounded-lg border p-3">
        <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">
            {format(startDate, 'd MMMM', { locale: it })} -{' '}
            {format(endDate, 'd MMMM yyyy', { locale: it })}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">
              {duration} {duration === 1 ? 'giorno' : 'giorni'}
            </p>
            <Badge variant={trip.status === 'confermato' ? 'default' : 'secondary'}>
              {trip.status === 'confermato' ? 'Confermato' : 'Da confermare'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Descrizione */}
      {trip.description && (
        <div className="rounded-lg border p-3">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {trip.description}
          </p>
        </div>
      )}

      <Separator />

      {/* Partecipanti */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Partecipanti</h3>
        </div>

        <div className="space-y-2">
          {members && members.length > 0 ? (
            members.map((member) => {
              // Determina se l'utente corrente può rimuovere questo membro
              const canRemove = isOwner || member.user_id === userId

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                <span className="text-sm">
                  {member.profiles?.display_name || `Utente ${member.user_id.substring(0, 8)}`}
                </span>
                  <div className="flex items-center gap-2">
                    {member.role === 'owner' && (
                      <Badge variant="secondary">Organizzatore</Badge>
                    )}
                    {member.status === 'pending' && (
                      <Badge variant="outline">In attesa</Badge>
                    )}
                    {member.status === 'accepted' && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700">Accettato</Badge>
                    )}
                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.user_id)}
                        disabled={removingMemberId === member.id}
                        className="h-7 w-7 p-0"
                      >
                        {removingMemberId === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
              Nessun partecipante ancora
            </div>
          )}
          
          {/* Inviti email in sospeso */}
          {invites && invites.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Inviti in sospeso</p>
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{invite.email}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">In attesa</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Azioni */}
      <div className="flex gap-2 pt-2">
        {!isUserMember && (
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="flex-1"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adesione...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Aderisci
              </>
            )}
          </Button>
        )}
        {isOwner && (
          <>
            <Button
              variant="outline"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Chiudi
        </Button>
      </div>
    </div>
  )
}
