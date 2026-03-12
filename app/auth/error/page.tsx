import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const errorMessage = params.error || 'Ocurrió un error inesperado durante la autenticación'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-balance">Error de Autenticación</CardTitle>
          <CardDescription className="text-pretty">
            Algo salió mal durante el proceso de inicio de sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <p className="text-pretty">{errorMessage}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Iniciar Sesión
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            ¿Necesitas ayuda?{' '}
            <a href="mailto:soporte@natura.com" className="text-primary hover:underline">
              Contacta soporte
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
