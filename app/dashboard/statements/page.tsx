'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Download, Calendar, Filter } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import { PaymentStatusBadge } from '@/components/dashboard/payment-status-badge'
import type { PaymentStatus } from '@/lib/types'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

const months = [
  { value: '0', label: 'This Month' },
  { value: '1', label: 'Last Month' },
  { value: '2', label: '2 Months Ago' },
  { value: '3', label: '3 Months Ago' },
  { value: '6', label: '6 Months Ago' },
  { value: '12', label: 'This Year' },
]

export default function StatementsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('0')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const supabase = createClient()

  const { data, isLoading } = useSWR(
    ['statements', selectedPeriod],
    async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const monthsAgo = parseInt(selectedPeriod)
      const now = new Date()
      let startDate: Date
      let endDate: Date

      if (monthsAgo === 12) {
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = now
      } else {
        const targetMonth = subMonths(now, monthsAgo)
        startDate = startOfMonth(targetMonth)
        endDate = monthsAgo === 0 ? now : endOfMonth(targetMonth)
      }

      const { data: purchases } = await supabase
        .from('purchases')
        .select(`
          *,
          product:products(*),
          payments(*)
        `)
        .eq('client_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      return {
        purchases: purchases || [],
        startDate,
        endDate,
      }
    }
  )

  const purchases = data?.purchases || []
  
  // Apply status filter
  const filteredPurchases = purchases.filter((purchase) => {
    if (statusFilter === 'all') return true
    const paid = purchase.payments?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) || 0
    const total = Number(purchase.total_price)
    const status = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending'
    return status === statusFilter
  })

  // Calculate totals
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + Number(p.total_price), 0)
  const totalPaid = filteredPurchases.reduce((sum, p) => {
    const paid = p.payments?.reduce((s: number, pay: { amount: number }) => s + Number(pay.amount), 0) || 0
    return sum + paid
  }, 0)
  const totalDue = totalPurchases - totalPaid

  const periodLabel = data?.startDate && data?.endDate
    ? `${format(data.startDate, 'MMM d, yyyy')} - ${format(data.endDate, 'MMM d, yyyy')}`
    : 'Loading...'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Statements</h1>
        <p className="text-muted-foreground">
          View and download your account statements
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Statement Summary</CardTitle>
          <CardDescription>{periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPurchases)}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-status-paid">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Balance Due</p>
              <p className={`text-2xl font-bold ${totalDue > 0 ? 'text-status-pending' : 'text-status-paid'}`}>
                {formatCurrency(totalDue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statement Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              {filteredPurchases.length} {filteredPurchases.length === 1 ? 'transaction' : 'transactions'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : filteredPurchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => {
                  const paid = purchase.payments?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) || 0
                  const total = Number(purchase.total_price)
                  const due = total - paid
                  const status: PaymentStatus = paid >= total ? 'paid' : paid > 0 ? 'partial' : 'pending'
                  
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell>{formatDate(purchase.created_at)}</TableCell>
                      <TableCell className="font-medium">{purchase.product?.name}</TableCell>
                      <TableCell className="text-center">{purchase.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                      <TableCell className="text-right text-status-paid">{formatCurrency(paid)}</TableCell>
                      <TableCell className={`text-right ${due > 0 ? 'text-status-pending' : ''}`}>
                        {formatCurrency(due)}
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
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-muted-foreground">
                No purchases found for the selected period and filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
