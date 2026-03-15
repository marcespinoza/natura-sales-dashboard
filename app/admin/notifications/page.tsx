'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Plus } from 'lucide-react'
import Link from 'next/link'

export default function NotificationsPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground text-sm">
            Envía y administra notificaciones a clientes
          </p>
        </div>
        <Button 
          asChild 
          className="w-full sm:w-auto"
        >
          <Link href="/admin/notifications/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Notificación
          </Link>
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enviar Notificación</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Crea una nueva notificación para enviar a todos los clientes o a uno específico.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notificaciones en la App</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Las notificaciones aparecerán en el icono de campana del dashboard de los clientes.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
