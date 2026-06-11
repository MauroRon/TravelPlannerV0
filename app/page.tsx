import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Plane, Users } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-primary">
            <Plane className="h-6 w-6" />
            <span className="text-xl font-bold">TravelPlan</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Accedi</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Registrati</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Pianifica i tuoi viaggi
            <br />
            <span className="text-primary">con gli amici</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            Condividi calendari, organizza itinerari e coordina le date 
            con il tuo gruppo. Viaggiare insieme non è mai stato così semplice.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Inizia gratis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Ho già un account</Link>
            </Button>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-center text-3xl font-bold text-foreground">
              Come funziona
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Calendar className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Crea un calendario</h3>
                <p className="mt-2 text-muted-foreground">
                  Crea un calendario condiviso per il tuo prossimo viaggio
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Invita gli amici</h3>
                <p className="mt-2 text-muted-foreground">
                  Condividi il link e invita i tuoi amici a partecipare
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Pianifica insieme</h3>
                <p className="mt-2 text-muted-foreground">
                  Coordina date, attività e itinerari tutti insieme
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Plane className="h-5 w-5" />
              <span className="font-medium">TravelPlan</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2025 TravelPlan. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
