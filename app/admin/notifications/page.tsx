import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, Plus, Info, Tag, CreditCard, Award, Globe } from 'lucide-react'
import { formatDate } from '@/lib/format'
import Link from 'next/link'

const typeIcons = {
  info: Info,
  promo: Tag,
  payment: CreditCard,
  points: Award,
}

const typeLabels = {
  info: 'Info',
  promo: 'Promo',
  payment: 'Pago',
  points: 'Puntos',
}

export default async function NotificationsPage() {
  const supabase = await createClient()

  // Get all notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select(`
      *,
      user:profiles(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  const allNotifications = notifications || []
  const globalNotifications = allNotifications.filter((n) => n.user_id === null)
  const userNotifications = allNotifications.filter((n) => n.user_id !== null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground">
            Envía y administra notificaciones a clientes
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/notifications/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Notificación
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allNotifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Anuncios Globales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{globalNotifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mensajes Individuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userNotifications.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Notificaciones</CardTitle>
          <CardDescription>
            Notificaciones recientes enviadas a clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allNotifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Destinatario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Mensaje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allNotifications.map((notification) => {
                  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info
                  
                  return (
                    <TableRow key={notification.id}>
                      <TableCell className="font-medium">
                        {formatDate(notification.created_at)}
                      </TableCell>
                      <TableCell>
                        {notification.user_id ? (
                          notification.user?.full_name || 'Desconocido'
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Globe className="h-3 w-3" />
                            Todos los Clientes
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {typeLabels[notification.type as keyof typeof typeLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {notification.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[300px] truncate">
                        {notification.message}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Sin notificaciones aún</p>
              <p className="text-muted-foreground mb-4">
                Envía tu primera notificación a los clientes
              </p>
              <Button asChild>
                <Link href="/admin/notifications/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Notificación
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
