import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Banknote, Smartphone, HelpCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'

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

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get all payments for this user's purchases
  const { data: payments } = await supabase
    .from('payments')
    .select(`
      *,
      purchase:purchases!inner(
        *,
        product:products(name)
      )
    `)
    .eq('purchase.client_id', user.id)
    .order('created_at', { ascending: false })

  const allPayments = payments || []
  const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">
          Track all your payments and transactions
        </p>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-status-paid">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{allPayments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>
            Your complete payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
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
                        {payment.purchase?.product?.name || 'Unknown Product'}
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
              <p className="text-muted-foreground">
                Your payment history will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
