import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Mail, Plane } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-primary">
              <Plane className="h-8 w-8" />
              <span className="text-2xl font-bold">TravelPlan</span>
            </div>
          </div>
          
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">
                Registrazione completata!
              </CardTitle>
              <CardDescription>Controlla la tua email</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Ti abbiamo inviato un&apos;email di conferma. 
                Clicca sul link nella email per attivare il tuo account 
                e iniziare a pianificare i tuoi viaggi.
              </p>
              <div className="mt-6">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Torna al login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
