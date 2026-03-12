import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBag, CreditCard, Award, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { PaymentStatusBadge } from '@/components/dashboard/payment-status-badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile with points
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get purchases with payments
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      product:products(*),
      payments(*)
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Calculate stats
  const allPurchases = purchases || []
  const totalSpent = allPurchases.reduce((sum, p) => sum + Number(p.total_price), 0)
  const totalPaid = allPurchases.reduce((sum, p) => {
    const paid = p.payments?.reduce((s: number, pay: { amount: number }) => s + Number(pay.amount), 0) || 0
    return sum + paid
  }, 0)
  const totalDue = totalSpent - totalPaid

  // Get recent purchases count for this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count: monthlyPurchases } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          ¡Bienvenida de nuevo, {profile?.full_name?.split(' ')[0] || 'amiga'}!
        </h1>
        <p className="text-muted-foreground">
          Aquí tienes un resumen de tu cuenta Natura
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyPurchases || 0} compras este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-paid">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              Pagos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalDue > 0 ? 'text-status-pending' : 'text-status-paid'}`}>
              {formatCurrency(totalDue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalDue > 0 ? 'Monto por pagar' : '¡Todo pagado!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos de Lealtad</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">
              {profile?.points_balance?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Puntos disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Alert */}
      {totalDue > 0 && (
        <Card className="border-status-pending/50 bg-status-pending/5">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-pending/10">
              <AlertCircle className="h-5 w-5 text-status-pending" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Tienes un saldo pendiente</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(totalDue)} pendiente en tus compras
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/payments">Ver Detalles</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Purchases */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Compras Recientes</CardTitle>
            <CardDescription>Tus últimos pedidos Natura</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/purchases">Ver Todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {allPurchases.length > 0 ? (
            <div className="space-y-4">
              {allPurchases.map((purchase) => {
                const paid = purchase.payments?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) || 0
                const status = paid >= Number(purchase.total_price) ? 'paid' : paid > 0 ? 'partial' : 'pending'
                
                return (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{purchase.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(purchase.created_at)} · Cant: {purchase.quantity}
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
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Sin compras aún</p>
              <p className="text-sm text-muted-foreground">
                Tu historial de compras aparecerá aquí
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
