'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export function PushNotificationPrompt() {
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotifications()
  const [dismissed, setDismissed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the prompt before
    const wasDismissed = localStorage.getItem('push-prompt-dismissed')
    if (wasDismissed) {
      setDismissed(true)
    }

    // Show prompt after 2 seconds if not subscribed and not dismissed
    const timer = setTimeout(() => {
      if (isSupported && !isSubscribed && !dismissed && permission !== 'denied') {
        setShowPrompt(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [isSupported, isSubscribed, dismissed, permission])

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('push-prompt-dismissed', 'true')
  }

  const handleSubscribe = async () => {
    const success = await subscribe()
    if (success) {
      setShowPrompt(false)
    }
  }

  if (!showPrompt || isLoading || isSubscribed || !isSupported) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-lg border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Activar notificaciones</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Recibe alertas sobre tus compras, puntos y promociones especiales.
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleSubscribe}>
                  Activar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Ahora no
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
