import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { PaymentStatusBadge } from '@/components/dashboard/payment-status-badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { PaymentStatus } from '@/lib/types'

export default async function AdminPage() {
  const supabase = await createClient()

  // Get counts
  const { count: clientsCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client')

  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)

  // Get all purchases with payments
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      product:products(name),
      client:profiles(full_name),
      payments(amount)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  // Calculate financials
  const { data: allPurchases } = await supabase
    .from('purchases')
    .select('total_price')

  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount')

  const totalRevenue = allPurchases?.reduce((sum, p) => sum + Number(p.total_price), 0) || 0
  const totalCollected = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  const totalOutstanding = totalRevenue - totalCollected

  // Get this month's stats
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: monthlyPurchases } = await supabase
    .from('purchases')
    .select('total_price')
    .gte('created_at', startOfMonth.toISOString())

  const monthlyRevenue = monthlyPurchases?.reduce((sum, p) => sum + Number(p.total_price), 0) || 0

  const recentPurchases = purchases || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your Natura business
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Products in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-status-paid">{formatCurrency(monthlyRevenue)}</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-paid">{formatCurrency(totalCollected)}</div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Alert */}
      {totalOutstanding > 0 && (
        <Card className="border-status-pending/50 bg-status-pending/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-pending/10">
              <AlertCircle className="h-5 w-5 text-status-pending" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Outstanding Balance</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(totalOutstanding)} pending across all clients
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/payments">Manage Payments</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/admin/sales/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                New Sale
              </CardTitle>
              <CardDescription>
                Record a new product sale
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/admin/payments/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-status-paid" />
                Record Payment
              </CardTitle>
              <CardDescription>
                Log a client payment
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <Link href="/admin/notifications/new">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-chart-3" />
                Send Notification
              </CardTitle>
              <CardDescription>
                Notify clients about updates
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/sales">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPurchases.length > 0 ? (
            <div className="space-y-4">
              {recentPurchases.map((purchase) => {
                const paid = purchase.payments?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) || 0
                const status: PaymentStatus = paid >= Number(purchase.total_price) ? 'paid' : paid > 0 ? 'partial' : 'pending'
                
                return (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{purchase.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {purchase.client?.full_name || 'Unknown'} · {formatDate(purchase.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(purchase.total_price)}</p>
                      <PaymentStatusBadge status={status} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No sales yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
