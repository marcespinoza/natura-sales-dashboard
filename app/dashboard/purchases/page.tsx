import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ShoppingBag } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { PaymentStatusBadge } from '@/components/dashboard/payment-status-badge'
import type { PaymentStatus } from '@/lib/types'

export default async function PurchasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get all purchases with products and payments
  const { data: purchases } = await supabase
    .from('purchases')
    .select(`
      *,
      product:products(*),
      payments(*)
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  const allPurchases = purchases || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historial de Compras</h1>
        <p className="text-muted-foreground">
          Ve todas tus compras de productos Natura
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas las Compras</CardTitle>
          <CardDescription>
            {allPurchases.length} {allPurchases.length === 1 ? 'compra' : 'compras'} en total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPurchases.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-center">Cant.</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPurchases.map((purchase) => {
                    const paid = purchase.payments?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) || 0
                    const total = Number(purchase.total_amount || 0)
                    const status: PaymentStatus = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending'
                    
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatDate(purchase.created_at)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">
                            <p className="font-medium truncate">{purchase.product?.name}</p>
                            {purchase.product?.category && (
                              <p className="text-xs text-muted-foreground truncate">
                                {purchase.product.category}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">{purchase.quantity}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {formatCurrency(purchase.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-medium whitespace-nowrap">
                          {formatCurrency(purchase.total_amount)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
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
            </div>
          ) : (
            <div className="text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Sin compras aún</p>
              <p className="text-muted-foreground">
                Tu historial de compras aparecerá aquí cuando hagas tu primer pedido
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
