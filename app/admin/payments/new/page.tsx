'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, ArrowLeft, AlertCircle, Banknote, Smartphone, HelpCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import Link from 'next/link'
import type { PaymentStatus } from '@/lib/types'
import { PaymentStatusBadge } from '@/components/dashboard/payment-status-badge'

interface PurchaseWithDetails {
  id: string
  total_price: number
  created_at: string
  product: { name: string } | null
  client: { id: string; full_name: string | null } | null
  payments: { amount: number }[]
}

export default function NewPaymentPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [purchaseId, setPurchaseId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Fetch purchases with outstanding balances
  const { data: purchases } = useSWR<PurchaseWithDetails[]>('outstanding-purchases', async () => {
    const { data } = await supabase
      .from('purchases')
      .select(`
        id,
        total_price,
        created_at,
        product:products(name),
        client:profiles(id, full_name),
        payments(amount)
      `)
      .order('created_at', { ascending: false })
    
    // Filter to only show purchases with outstanding balance
    return (data || []).filter((p) => {
      const paid = p.payments?.reduce((s, pay) => s + Number(pay.amount), 0) || 0
      return paid < Number(p.total_price)
    })
  })

  const selectedPurchase = purchases?.find((p) => p.id === purchaseId)
  const amountPaid = selectedPurchase?.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0
  const amountDue = selectedPurchase ? Number(selectedPurchase.total_price) - amountPaid : 0
  const status: PaymentStatus = amountPaid >= (selectedPurchase?.total_price || 0) ? 'paid' : amountPaid > 0 ? 'partial' : 'pending'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!purchaseId || !amount || !paymentMethod) {
      toast.error('Please fill in all required fields')
      return
    }

    const paymentAmount = parseFloat(amount)
    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than 0')
      return
    }

    if (paymentAmount > amountDue) {
      toast.error(`Payment amount cannot exceed outstanding balance (${formatCurrency(amountDue)})`)
      return
    }

    setIsSaving(true)

    const { error } = await supabase
      .from('payments')
      .insert({
        purchase_id: purchaseId,
        amount: paymentAmount,
        payment_method: paymentMethod,
        notes: notes || null,
      })

    if (error) {
      toast.error('Failed to record payment')
      setIsSaving(false)
      return
    }

    // Send notification to client if purchase is now fully paid
    if (selectedPurchase && paymentAmount === amountDue) {
      await supabase.from('notifications').insert({
        user_id: selectedPurchase.client?.id,
        title: 'Payment Complete',
        message: `Your payment for ${selectedPurchase.product?.name} has been received. Thank you!`,
        type: 'payment',
      })
    }

    toast.success('Payment recorded successfully')
    router.push('/admin/payments')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/payments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Record Payment</h1>
          <p className="text-muted-foreground">
            Log a payment for an outstanding purchase
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Select the purchase and enter payment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Purchase Selection */}
              <div className="space-y-2">
                <Label>Select Purchase *</Label>
                <Select value={purchaseId} onValueChange={setPurchaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a purchase with outstanding balance..." />
                  </SelectTrigger>
                  <SelectContent>
                    {purchases?.map((purchase) => {
                      const paid = purchase.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0
                      const due = Number(purchase.total_price) - paid
                      
                      return (
                        <SelectItem key={purchase.id} value={purchase.id}>
                          <div className="flex items-center gap-2">
                            <span>{purchase.client?.full_name}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{purchase.product?.name}</span>
                            <Badge variant="outline" className="ml-2 text-status-pending">
                              {formatCurrency(due)} due
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {purchases?.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No purchases with outstanding balances found
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={amountDue}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
                {amountDue > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(amountDue.toFixed(2))}
                    >
                      Pay Full Amount ({formatCurrency(amountDue)})
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Cash
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Card
                      </div>
                    </SelectItem>
                    <SelectItem value="other">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPurchase ? (
                <>
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium">{selectedPurchase.client?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product</span>
                      <span className="font-medium">{selectedPurchase.product?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchase Date</span>
                      <span>{formatDate(selectedPurchase.created_at)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="font-medium">{formatCurrency(selectedPurchase.total_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Already Paid</span>
                      <span className="text-status-paid">{formatCurrency(amountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span className="text-status-pending font-medium">{formatCurrency(amountDue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <PaymentStatusBadge status={status} />
                    </div>
                  </div>

                  {amount && parseFloat(amount) > 0 && (
                    <div className="rounded-lg border border-status-paid/30 bg-status-paid/5 p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Payment Amount</span>
                        <span className="text-lg font-bold text-status-paid">
                          {formatCurrency(parseFloat(amount))}
                        </span>
                      </div>
                      {parseFloat(amount) === amountDue && (
                        <p className="text-sm text-status-paid mt-2">
                          This will fully pay off the outstanding balance
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg bg-muted p-8 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Select a purchase to see details
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSaving || !purchaseId || !amount || !paymentMethod}
              >
                {isSaving ? <Spinner className="mr-2" /> : null}
                Record Payment
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
