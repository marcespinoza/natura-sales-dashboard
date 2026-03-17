import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <div className="relative">
              <Mail className="h-8 w-8 text-accent-foreground" />
              <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-accent-foreground bg-accent rounded-full" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-balance">Revisa tu correo</CardTitle>
          <CardDescription className="text-pretty">
            Te hemos enviado un enlace de confirmación para verificar tu correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="text-pretty">
              Haz clic en el enlace del correo para completar tu registro. 
              Si no lo ves, revisa tu carpeta de spam.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login" className="flex items-center gap-2">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icons8-naturaleza-y-compa%C3%B1%C3%ADa-100-5fL1cBNIljBW3HNggQLzzJD8aYuTpb.png"
                alt="Natura"
                width={16}
                height={16}
                className="object-contain"
              />
              Volver a Iniciar Sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
