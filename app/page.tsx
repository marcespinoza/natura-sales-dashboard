import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, CreditCard, Award, ArrowRight } from 'lucide-react'
import { Span } from 'next/dist/trace'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cropped-Logo-Natura-Biobelleza-2024-Oficial-dB54NmgfKX3QjQp0Ag8JUrAzTGOnJU.png"
              alt="Natura"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-xl font-bold">Natura</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Iniciar Sesión</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Registrarse</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Tu espacio de consultoría{' '}
              <span className="text-primary">con Wilma</span>{' '}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Controla tus compras, administra pagos y gana puntos de lealtad. 
              Todo lo que necesitas para estar conectada con tu consultora Natura.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">
                  Crear Cuenta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">Iniciar Sesión</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Historial de Compras</CardTitle>
                <CardDescription className="text-pretty">
                  Ve todas tus compras de productos Natura en un solo lugar con información detallada de cada pedido
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Historial completo de pedidos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Detalles y precios de productos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Descarga de estados de cuenta
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 mb-2">
                  <CreditCard className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Seguimiento de Pagos</CardTitle>
                <CardDescription className="text-pretty">
                  Mantente al día con tus pagos con indicadores claros de estado y seguimiento de saldos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Estado de pagos en tiempo real
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Alertas de saldo pendiente
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    Historial de pagos
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/20 mb-2">
                  <Award className="h-6 w-6 text-chart-3" />
                </div>
                <CardTitle>Puntos de Lealtad</CardTitle>
                <CardDescription className="text-pretty">
                  Gana puntos en cada compra y sigue el saldo de tus recompensas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                    Acumulación automática de puntos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                    Historial de movimientos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                    Seguimiento de canjes
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-balance">
                ¿Lista para comenzar?
              </h2>
              <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto text-pretty">
                Crea tu cuenta hoy y comienza a controlar todas tus compras Natura 
                en un solo lugar conveniente.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/sign-up">
                  Crear Cuenta Gratis
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Portal de la Consultora Natura Wilma Riquelme. Hecho con cariño.</p>
        </div>
      </footer>
    </div>
  )
}
