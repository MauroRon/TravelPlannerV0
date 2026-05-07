import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Plane } from 'lucide-react'
import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

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
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">
                Qualcosa è andato storto
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {params?.error ? (
                <p className="text-sm text-muted-foreground">
                  Errore: {params.error}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Si è verificato un errore durante l&apos;autenticazione. 
                  Riprova o contatta il supporto se il problema persiste.
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                <Button asChild>
                  <Link href="/auth/login">Torna al login</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/auth/sign-up">Crea un nuovo account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
