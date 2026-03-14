import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

  // Get all clients (non-admins)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // Get all admins to exclude them
  const { data: admins } = await supabase
    .from('admins')
    .select('email')

  const adminEmails = new Set((admins || []).map(a => a.email.toLowerCase()))

  // Get all purchases with payments
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      client_id,
      total_price,
      created_at,
      payments(amount)
    `)

  // Get start of current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  // Calculate stats for each client (exclude admins)
  const clientsWithStats = (profiles || [])
    .filter(p => {
      // If profile has email, check if it's NOT an admin
      if (p.email) {
        return !adminEmails.has(p.email.toLowerCase())
      }
      // If no email in profile, include them (they're clients)
      return true
    })
    .map(p => {
      const clientPurchases = (purchases || []).filter(pr => pr.client_id === p.id)
      const totalSpent = clientPurchases.reduce((sum, p) => sum + (p.total_price || 0), 0)
      const totalPaid = clientPurchases.reduce((sum, p) => 
        sum + (p.payments?.reduce((s: number, pm: any) => s + (pm.amount || 0), 0) || 0), 0
      )
      const monthlyPurchases = clientPurchases.filter(p => 
        new Date(p.created_at) >= startOfMonth
      ).reduce((sum, p) => sum + (p.total_price || 0), 0)

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
}
