'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface NotificationHistory {
  id: string
  sent_by: string
  recipient_id: string | null
  title: string
  message: string
  notification_type: 'info' | 'promo' | 'payment' | 'points'
  is_global: boolean
  created_at: string
  profiles?: { full_name: string }
}

export default function NotificationHistoryPage() {
  const supabase = createClient()
  
  const { data: notifications } = useSWR<NotificationHistory[]>(
    'notification-history',
    async () => {
      const { data } = await supabase
        .from('notification_history')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100)
      return data || []
    }
  )

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getTypeColor(type: string) {
    switch (type) {
      case 'promo':
        return 'bg-primary/10 text-primary'
      case 'payment':
        return 'bg-chart-2/20 text-chart-2'
      case 'points':
        return 'bg-chart-3/20 text-chart-3'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/notifications">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Historial de Notificaciones</h1>
          <p className="text-muted-foreground">Todas las notificaciones enviadas</p>
        </div>
      </div>

      <div className="space-y-4">
        {notifications?.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No hay notificaciones enviadas aún
            </CardContent>
          </Card>
        ) : (
          notifications?.map((notif) => (
            <Card key={notif.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <CardTitle className="text-base">{notif.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {notif.message}
                    </CardDescription>
                  </div>
                  <Badge className={getTypeColor(notif.notification_type)}>
                    {notif.notification_type === 'promo' && 'Promoción'}
                    {notif.notification_type === 'payment' && 'Pago'}
                    {notif.notification_type === 'points' && 'Puntos'}
                    {notif.notification_type === 'info' && 'Información'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    {notif.is_global ? (
                      <span>Enviado a: Todos los clientes</span>
                    ) : (
                      <span>Enviado a: {notif.profiles?.full_name || 'Cliente eliminado'}</span>
                    )}
                  </div>
                  <span>{formatDate(notif.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
