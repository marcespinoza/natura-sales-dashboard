'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
    
    if (supported) {
      setPermission(Notification.permission)
      checkSubscription()
    } else {
      setIsLoading(false)
    }
  }, [])

  async function checkSubscription() {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function subscribe() {
    if (!isSupported) return false

    try {
      setIsLoading(true)
      console.log('[v0] Starting push subscription process')

      // Request permission
      const permissionResult = await Notification.requestPermission()
      setPermission(permissionResult)
      console.log('[v0] Notification permission:', permissionResult)

      if (permissionResult !== 'granted') {
        console.log('[v0] Permission not granted')
        return false
      }

      // Register service worker
      console.log('[v0] Registering service worker...')
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      console.log('[v0] Service worker registered:', registration)

      // Get VAPID public key
      console.log('[v0] Fetching VAPID public key...')
      const response = await fetch('/api/push/vapid-public-key')
      if (!response.ok) {
        console.error('[v0] Failed to fetch VAPID key:', response.status)
        return false
      }
      const responseData = await response.json()
      const publicKey = responseData?.publicKey
      console.log('[v0] VAPID public key received:', publicKey ? 'yes' : 'no')

      if (!publicKey) {
        console.error('[v0] VAPID public key not available')
        return false
      }

      // Subscribe to push
      console.log('[v0] Subscribing to push manager...')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      console.log('[v0] Push subscription created:', subscription.endpoint)

      // Save subscription to database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[v0] User authenticated:', user?.id)

      if (!user) {
        console.error('[v0] User not authenticated')
        return false
      }

      const subscriptionJson = subscription.toJSON()
      
      console.log('[v0] Saving subscription to database...')
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: subscriptionJson.keys?.p256dh || '',
          auth: subscriptionJson.keys?.auth || '',
        })

      if (error) {
        console.error('[v0] Error saving subscription:', error)
        return false
      }

      console.log('[v0] Subscription saved successfully')
      setIsSubscribed(true)
      return true
    } catch (error) {
      console.error('[v0] Error subscribing to push:', error instanceof Error ? error.message : String(error))
      console.error('[v0] Full error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  async function unsubscribe() {
    try {
      setIsLoading(true)
      
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Remove from database
        const supabase = createClient()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint)

        // Unsubscribe from push
        await subscription.unsubscribe()
      }

      setIsSubscribed(false)
      return true
    } catch (error) {
      console.error('Error unsubscribing:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
