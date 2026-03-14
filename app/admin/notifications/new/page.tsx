'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bell, ArrowLeft, Globe, User, Info, Tag, CreditCard, Award } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

export default function NewNotificationPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [recipientType, setRecipientType] = useState<'all' | 'individual'>('all')
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'info' | 'promo' | 'payment' | 'points'>('info')
  const [isSending, setIsSending] = useState(false)

  // Fetch clients (non-admins)
  const { data: clients } = useSWR<Profile[]>('notification-clients', async () => {
    // Get all admins to exclude them
    const { data: admins } = await supabase
      .from('admins')
      .select('email')
    
    const adminEmails = new Set((admins || []).map(a => a.email.toLowerCase()))
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    
    // Filter out admins (case-insensitive)
    return (profiles || []).filter(p => !adminEmails.has((p.email || '').toLowerCase()))
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title || !message) {
      toast.error('Por favor completa el título y mensaje')
      return
    }

    if (recipientType === 'individual' && !userId) {
      toast.error('Por favor selecciona un destinatario')
      return
    }

    setIsSending(true)

    const notificationData = {
      user_id: recipientType === 'all' ? null : userId,
      title,
      message,
      type: notificationType,
      read: false,
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notificationData)

    if (error) {
      console.error('[v0] Notification error:', error)
      toast.error(`Error al enviar notificación: ${error.message}`)
      setIsSending(false)
      return
    }

    toast.success(
      recipientType === 'all'
        ? 'Notificación enviada a todos los clientes'
        : 'Notificación enviada correctamente'
    )
    router.push('/admin/notifications')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/notifications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Notificación</h1>
          <p className="text-muted-foreground">
            Envía una notificación a tus clientes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Detalles de Notificación
              </CardTitle>
              <CardDescription>
                Compón tu mensaje de notificación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient Type */}
              <div className="space-y-3">
                <Label>Enviar A</Label>
                <RadioGroup
                  value={recipientType}
                  onValueChange={(value) => setRecipientType(value as 'all' | 'individual')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                      <Globe className="h-4 w-4" />
                      Todos los Clientes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Cliente Específico
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Client Selection (if individual) */}
              {recipientType === 'individual' && (
                <div className="space-y-2">
                  <Label>Seleccionar Cliente *</Label>
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige un cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name || 'Sin nombre'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notification Type */}
              <div className="space-y-2">
                <Label>Tipo de Notificación</Label>
                <Select
                  value={notificationType}
                  onValueChange={(value) => setNotificationType(value as typeof notificationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Información General
                      </div>
                    </SelectItem>
                    <SelectItem value="promo">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Promoción
                      </div>
                    </SelectItem>
                    <SelectItem value="payment">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Pago
                      </div>
                    </SelectItem>
                    <SelectItem value="points">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Puntos
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej., ¡Nuevos Productos Disponibles!"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje de notificación..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
              <CardDescription>
                Cómo verán los clientes tu notificación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notificationType === 'promo' ? 'bg-primary/10 text-primary' :
                    notificationType === 'payment' ? 'bg-chart-2/20 text-chart-2' :
                    notificationType === 'points' ? 'bg-chart-3/20 text-chart-3' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {notificationType === 'info' && <Info className="h-5 w-5" />}
                    {notificationType === 'promo' && <Tag className="h-5 w-5" />}
                    {notificationType === 'payment' && <CreditCard className="h-5 w-5" />}
                    {notificationType === 'points' && <Award className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">
                      {title || 'Título de Notificación'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {message || 'Tu mensaje de notificación aparecerá aquí...'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ahora mismo
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Destinatarios</h4>
                <p className="text-sm text-muted-foreground">
                  {recipientType === 'all' ? (
                    <>
                      <Globe className="inline h-4 w-4 mr-1" />
                      Los {clients?.length || 0} clientes recibirán esta notificación
                    </>
                  ) : userId ? (
                    <>
                      <User className="inline h-4 w-4 mr-1" />
                      {clients?.find((c) => c.id === userId)?.full_name || 'Cliente seleccionado'}
                    </>
                  ) : (
                    'Selecciona un cliente para ver vista previa'
                  )}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isSending || !title || !message || (recipientType === 'individual' && !userId)}
              >
                {isSending ? <Spinner className="mr-2" /> : <Bell className="mr-2 h-4 w-4" />}
                Enviar Notificación
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
