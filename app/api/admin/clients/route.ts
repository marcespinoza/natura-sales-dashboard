import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all clients (profiles)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, email, points_balance, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('[v0] Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }

    // Get all purchases
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('id, client_id, total_amount, status, created_at')

    if (purchasesError) {
      console.error('[v0] Error fetching purchases:', purchasesError)
      return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
    }

    // Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, purchase_id, amount, created_at')

    if (paymentsError) {
      console.error('[v0] Error fetching payments:', paymentsError)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Get admins to filter them out
    const { data: admins } = await supabase
      .from('admins')
      .select('email')

    const adminEmails = new Set((admins || []).map(a => a.email.toLowerCase()))

    // Get start of current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Calculate stats for each client (exclude admins)
    const clientsWithStats = (profiles || [])
      .filter(p => {
        // Exclude admins
        if (p.email) {
          return !adminEmails.has(p.email.toLowerCase())
        }
        return true
      })
      .map(p => {
        const clientPurchases = (purchases || []).filter(pr => pr.client_id === p.id)
        const totalSpent = clientPurchases.reduce((sum, pr) => sum + (pr.total_amount || 0), 0)
        
        // Calculate total paid from payments
        const purchaseIds = new Set(clientPurchases.map(pr => pr.id))
        const totalPaid = (payments || [])
          .filter(pm => purchaseIds.has(pm.purchase_id))
          .reduce((sum, pm) => sum + (pm.amount || 0), 0)

        const monthlyPurchases = clientPurchases
          .filter(pr => new Date(pr.created_at) >= startOfMonth)
          .reduce((sum, pr) => sum + (pr.total_amount || 0), 0)

        return {
          id: p.id,
          full_name: p.full_name,
          phone: p.phone,
          email: p.email,
          points_balance: p.points_balance || 0,
          created_at: p.created_at,
          totalSpent,
          totalPaid,
          totalDue: totalSpent - totalPaid,
          purchaseCount: clientPurchases.length,
          monthlyPurchases,
        }
      })

    // Calculate totals
    const totals = {
      totalClients: clientsWithStats.length,
      totalSales: clientsWithStats.reduce((sum, c) => sum + c.totalSpent, 0),
      totalCollected: clientsWithStats.reduce((sum, c) => sum + c.totalPaid, 0),
      totalPending: clientsWithStats.reduce((sum, c) => sum + c.totalDue, 0),
    }

    return NextResponse.json({ clients: clientsWithStats, totals })
  } catch (error) {
    console.error('[v0] API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
