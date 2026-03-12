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
        <h1 className="text-2xl font-bold tracking-tight">Purchase History</h1>
        <p className="text-muted-foreground">
          View all your Natura product purchases
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchases</CardTitle>
          <CardDescription>
            {allPurchases.length} total {allPurchases.length === 1 ? 'purchase' : 'purchases'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPurchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-center">Status</TableHead>
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
                      <TableCell>
                        <div>
                          <p className="font-medium">{purchase.product?.name}</p>
                          {purchase.product?.category && (
                            <p className="text-xs text-muted-foreground">
                              {purchase.product.category}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{purchase.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(purchase.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(purchase.total_price)}
                      </TableCell>
                      <TableCell className="text-right">
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
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No purchases yet</p>
              <p className="text-muted-foreground">
                Your purchase history will appear here once you make your first order
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
