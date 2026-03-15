'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Bell } from 'lucide-react'

export function PushNotificationPrompt() {
  const [dismissed, setDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (dismissed) return null

  async function handleEnable() {
    try {
      setIsLoading(true)
      setError(null)

      // Check if notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setError('Tu navegador no soporta notificaciones push')
        return
      }

      // Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Necesitas permitir las notificaciones')
        return
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Get VAPID key
      const response = await fetch('/api/push/vapid-public-key')
      if (!response.ok) throw new Error('Error fetching VAPID key')
      const { publicKey } = await response.json()

      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      // Save to database
      const saveResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: subscription.toJSON().keys?.p256dh,
          auth: subscription.toJSON().keys?.auth,
        }),
      })

      if (!saveResponse.ok) throw new Error('Error saving subscription')

      setDismissed(true)
    } catch (err) {
      console.error('[v0] Push notification error:', err)
      setError(err instanceof Error ? err.message : 'Error al habilitar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Alert className="fixed bottom-4 right-4 max-w-sm">
      <Bell className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Notificaciones</p>
          <p className="text-sm text-muted-foreground">Recibe alertas en tiempo real</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            disabled={isLoading}
          >
            Después
          </Button>
          <Button
            size="sm"
            onClick={handleEnable}
            disabled={isLoading}
          >
            {isLoading ? 'Habilitando...' : 'Habilitar'}
          </Button>
        </div>
      </AlertDescription>
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}
    </Alert>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
