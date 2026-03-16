import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get settings
    const { data: settings } = await supabase
      .from('settings')
      .select('points_expiration_days')
      .single()

    if (!settings?.points_expiration_days) {
      return NextResponse.json({ error: 'Points expiration not configured' }, { status: 400 })
    }

    // Calculate expiration date
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() - settings.points_expiration_days)

    // Find profiles with points created before expiration date
    const { data: expiredProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, points_balance, created_at')
      .lt('created_at', expirationDate.toISOString())
      .gt('points_balance', 0)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      return NextResponse.json({ message: 'No expired points found', expired: 0 })
    }

    // Expire points for each profile
    let expiredCount = 0
    for (const profile of expiredProfiles) {
      // Log the expiration
      const { error: logError } = await supabase
        .from('points_expiration_log')
        .insert({
          user_id: profile.id,
          points_expired: profile.points_balance,
          expired_at: new Date().toISOString(),
        })

      if (!logError) {
        // Reset points to 0
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ points_balance: 0 })
          .eq('id', profile.id)

        if (!updateError) {
          expiredCount++
        }
      }
    }

    return NextResponse.json({
      message: 'Points expiration completed successfully',
      expired: expiredCount,
      total: expiredProfiles.length,
    })
  } catch (error) {
    console.error('[v0] Points expiration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
