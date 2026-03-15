import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

export async function POST(request: Request) {
  try {
    console.log('[v0] Push notification API called')
    
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[v0] User ID:', user?.id)
    
    if (!user) {
      console.log('[v0] No user authenticated')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminRecord } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email?.toLowerCase())
      .single()

    console.log('[v0] Admin check:', adminRecord ? 'yes' : 'no')
    
    if (!adminRecord) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { title, message, userId } = await request.json()
    console.log('[v0] Notification params:', { title, message, userId })

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
    }

    // Get subscriptions
    let query = supabase.from('push_subscriptions').select('*')
    
    if (userId) {
      // Send to specific user
      console.log('[v0] Fetching subscriptions for user:', userId)
      query = query.eq('user_id', userId)
    } else {
      console.log('[v0] Fetching all subscriptions')
    }

    const { data: subscriptions, error } = await query

    if (error) {
      console.error('[v0] Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    console.log('[v0] Subscriptions found:', subscriptions?.length || 0)
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log('[v0] No subscriptions to send to')
      return NextResponse.json({ message: 'No subscriptions found', sent: 0 })
    }

    // Send notifications
    const payload = JSON.stringify({
      title,
      message,
      url: '/dashboard',
    })

    console.log('[v0] Sending notifications to', subscriptions.length, 'subscribers')
    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          console.log('[v0] Sending to endpoint:', sub.endpoint.substring(0, 50) + '...')
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload
          )
          console.log('[v0] Notification sent successfully')
          return { success: true, endpoint: sub.endpoint }
        } catch (err: any) {
          console.error('[v0] Error sending notification:', err.message, 'Status:', err.statusCode)
          
          // If subscription is expired or invalid, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log('[v0] Removing expired subscription')
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }
          return { success: false, endpoint: sub.endpoint, error: err.message }
        }
      })
    )

    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length

    console.log('[v0] Push notifications completed:', successful, 'of', subscriptions.length)

    return NextResponse.json({
      message: `Sent ${successful} of ${subscriptions.length} notifications`,
      sent: successful,
      total: subscriptions.length,
    })
  } catch (error) {
    console.error('[v0] Push notification error:', error)
    return NextResponse.json({ error: 'Failed to send notifications' }, { status: 500 })
  }
}
