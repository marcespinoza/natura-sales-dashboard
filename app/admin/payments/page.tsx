import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Plus, Banknote, Smartphone, HelpCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import Link from 'next/link'

const paymentMethodIcons = {
  cash: Banknote,
  transfer: Smartphone,
  card: CreditCard,
  other: HelpCircle,
}

const paymentMethodLabels = {
  cash: 'Cash',
  transfer: 'Transfer',
  card: 'Card',
  other: 'Other',
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient()

  // Get all payments with purchase and client info
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      purchase:purchases(
        *,
        product:products(name),
        client:profiles(full_name)
      )
    `)
    .order('created_at', { ascending: false })

  const allPayments = payments || []
  const totalCollected = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  // Get outstanding balance
  const { data: purchases } = await supabase
    .from('purchases')
    .select('total_price, payments(amount)')

  const totalSales = purchases?.reduce((sum, p) => sum + Number(p.total_price), 0) || 0
  const totalPaid = purchases?.reduce((sum, p) => {
    const paid = p.payments?.reduce((s: number, pay: { amount: number }) => s + Number(pay.amount), 0) || 0
    return sum + paid
  }, 0) || 0
  const totalOutstanding = totalSales - totalPaid

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Track and record client payments
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/payments/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-paid">{formatCurrency(totalCollected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-pending">{formatCurrency(totalOutstanding)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSales > 0 ? Math.round((totalPaid / totalSales) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            {allPayments.length} {allPayments.length === 1 ? 'payment' : 'payments'} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayments.map((payment) => {
                  const Icon = paymentMethodIcons[payment.payment_method as keyof typeof paymentMethodIcons] || HelpCircle
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell>
                        {payment.purchase?.client?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {payment.purchase?.product?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {paymentMethodLabels[payment.payment_method as keyof typeof paymentMethodLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-status-paid">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.notes || '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No payments yet</p>
              <p className="text-muted-foreground mb-4">
                Record your first payment to get started
              </p>
              <Button asChild>
                <Link href="/admin/payments/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Payment
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
