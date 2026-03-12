import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { PaymentStatusBadge } from '@/components/dashboard/payment-status-badge'
import Link from 'next/link'
import type { PaymentStatus } from '@/lib/types'

export default async function SalesPage() {
  const supabase = await createClient()

  // Get all purchases with products, clients, and payments
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      product:products(name, category),
      client:profiles(full_name),
      payments(amount)
    `)
    .order('created_at', { ascending: false })

  const allPurchases = purchases || []

  // Calculate totals
  const totalSales = allPurchases.reduce((sum, p) => sum + Number(p.total_price), 0)
  const totalPaid = allPurchases.reduce((sum, p) => {
    const paid = p.payments?.reduce((s: number, pay: { amount: number }) => s + Number(pay.amount), 0) || 0
    return sum + paid
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Ve y administra todas las transacciones de ventas
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Venta
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allPurchases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-paid">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas las Ventas</CardTitle>
          <CardDescription>
            {allPurchases.length} {allPurchases.length === 1 ? 'venta' : 'ventas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPurchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPurchases.map((purchase) => {
                  const paid = purchase.payments?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) || 0
                  const total = Number(purchase.total_price)
                  const status: PaymentStatus = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending'
                  
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">
                        {formatDate(purchase.created_at)}
                      </TableCell>
                      <TableCell>{purchase.client?.full_name || 'Desconocido'}</TableCell>
                      <TableCell>
                        <div>
                          <p>{purchase.product?.name}</p>
                          {purchase.product?.category && (
                            <p className="text-xs text-muted-foreground">
                              {purchase.product.category}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{purchase.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(total)}
                      </TableCell>
                      <TableCell className="text-right text-status-paid">
                        {formatCurrency(paid)}
                      </TableCell>
                      <TableCell className="text-center">
                        <PaymentStatusBadge status={status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Sin ventas aún</p>
              <p className="text-muted-foreground mb-4">
                Registra tu primera venta para comenzar
              </p>
              <Button asChild>
                <Link href="/admin/sales/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Venta
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
