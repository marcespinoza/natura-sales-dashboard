import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    console.log('[v0] Subscribe endpoint called')
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('[v0] No user authenticated')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { endpoint, p256dh, auth } = await request.json()
    
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 })
    }

    console.log('[v0] Saving subscription for user:', user.id)

    // Delete any existing subscription for this endpoint first
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
    
    // Insert the new subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
      })

    if (error) {
      console.error('[v0] Error saving subscription:', error)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    console.log('[v0] Subscription saved successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
