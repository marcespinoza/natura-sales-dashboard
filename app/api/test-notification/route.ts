import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidEmail = process.env.VAPID_EMAIL || 'admin@example.com'

// Format email as mailto: if not already
const vapidSubject = vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is admin
  const { data: adminRecord } = await supabase
    .from('admins')
    .select('id')
    .eq('email', user.email?.toLowerCase() || '')
    .single()

  if (!adminRecord) {
    return NextResponse.json({ error: 'Not an admin' }, { status: 403 })
  }

  try {
    // Create test notification in DB
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        title: 'Notificación de Prueba',
        message: 'Esta es una notificación de prueba para verificar que el sistema funciona correctamente.',
        is_global: true,
        is_read: false,
      })

    if (notificationError) {
      console.error('[v0] Notification error:', notificationError)
      return NextResponse.json({ error: notificationError.message }, { status: 500 })
    }

    // Send push notifications
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')

    let sent = 0
    let failed = 0
    
    if (subscriptions && subscriptions.length > 0) {
      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          }

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: 'Notificación de Prueba',
              body: 'Esta es una notificación de prueba para verificar que el sistema funciona.',
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: 'test-notification',
            })
          )
          sent++
        } catch (error) {
          console.error('[v0] Error sending push:', error)
          failed++
          
          // If subscription is invalid, delete it
          if (error instanceof webpush.WebPushError && error.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', subscription.id)
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notificación de prueba enviada',
      sent,
      failed,
      total: subscriptions?.length || 0
    })
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
