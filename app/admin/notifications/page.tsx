'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function NotificationsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)

  async function sendTestNotification() {
    setIsSending(true)
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Notificación de prueba enviada a ${data.sent} dispositivos`)
      } else {
        toast.error(data.error || 'Error al enviar notificación')
      }
    } catch (error) {
      console.error('[v0] Error:', error)
      toast.error('Error al enviar notificación de prueba')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground text-sm">
            Envía y administra notificaciones a clientes
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
          <Button 
            asChild 
            className="w-full sm:w-auto"
          >
            <Link href="/admin/notifications/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Notificación
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={sendTestNotification}
            disabled={isSending}
            className="w-full sm:w-auto"
          >
            {isSending ? 'Enviando...' : 'Notificación de Prueba'}
          </Button>
        </div>
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
            <CardTitle className="text-base">Prueba el Sistema</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Usa el botón "Notificación de Prueba" para verificar que los clientes reciban las notificaciones push correctamente.</p>
          </CardContent>
        </Card>
      </div>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>Cómo Funcionan las Notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">1. Permisos del Navegador</p>
            <p className="text-muted-foreground">Los clientes verán un prompt pidiendo permiso para recibir notificaciones push.</p>
          </div>
          <div>
            <p className="font-medium mb-1">2. Notificaciones Globales</p>
            <p className="text-muted-foreground">Se envían a todos los clientes que han aceptado recibir notificaciones.</p>
          </div>
          <div>
            <p className="font-medium mb-1">3. Notificaciones Individuales</p>
            <p className="text-muted-foreground">Se envían a un cliente específico seleccionando desde la página de detalles del cliente.</p>
          </div>
          <div>
            <p className="font-medium mb-1">4. Historial</p>
            <p className="text-muted-foreground">Todas las notificaciones se guardan en el historial de cada cliente.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
