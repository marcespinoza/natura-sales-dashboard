import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
        title: '📢 Notificación de Prueba',
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
    
    if (subscriptions && subscriptions.length > 0) {
      for (const subscription of subscriptions) {
        try {
          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
            },
            body: JSON.stringify({
              to: subscription.endpoint,
              notification: {
                title: '📢 Notificación de Prueba',
                body: 'Esta es una notificación de prueba para verificar que el sistema funciona.',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
              },
            }),
          })

          if (response.ok) {
            sent++
          }
        } catch (error) {
          console.error('[v0] Error sending push:', error)
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Notificación de prueba enviada',
      sent 
    })
  } catch (error) {
    console.error('[v0] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
