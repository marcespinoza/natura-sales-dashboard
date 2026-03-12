import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Mail, Phone, Award, ShoppingBag, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import Link from 'next/link'

export default async function ClientsPage() {
  const supabase = await createClient()

  // Get all clients with their purchases and payments
  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'client')
    .order('created_at', { ascending: false })

  // Get purchase summaries for each client
  const clientsWithStats = await Promise.all(
    (clients || []).map(async (client) => {
      const { data: purchases } = await supabase
        .from('purchases')
        .select('total_price, payments(amount)')
        .eq('client_id', client.id)

      const totalSpent = purchases?.reduce((sum, p) => sum + Number(p.total_price), 0) || 0
      const totalPaid = purchases?.reduce((sum, p) => {
        const paid = p.payments?.reduce((s: number, pay: { amount: number }) => s + Number(pay.amount), 0) || 0
        return sum + paid
      }, 0) || 0
      const totalDue = totalSpent - totalPaid

      return {
        ...client,
        totalSpent,
        totalPaid,
        totalDue,
        purchaseCount: purchases?.length || 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your client accounts and balances
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsWithStats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(clientsWithStats.reduce((sum, c) => sum + c.totalSpent, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-paid">
              {formatCurrency(clientsWithStats.reduce((sum, c) => sum + c.totalPaid, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-pending">
              {formatCurrency(clientsWithStats.reduce((sum, c) => sum + c.totalDue, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {clientsWithStats.length} registered {clientsWithStats.length === 1 ? 'client' : 'clients'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientsWithStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Purchases</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Due</TableHead>
                  <TableHead className="text-center">Points</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithStats.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.full_name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDate(client.created_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{client.purchaseCount}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(client.totalSpent)}
                    </TableCell>
                    <TableCell className="text-right text-status-paid">
                      {formatCurrency(client.totalPaid)}
                    </TableCell>
                    <TableCell className={`text-right ${client.totalDue > 0 ? 'text-status-pending font-medium' : ''}`}>
                      {formatCurrency(client.totalDue)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1">
                        <Award className="h-3 w-3" />
                        {client.points_balance}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/clients/${client.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No clients yet</p>
              <p className="text-muted-foreground">
                Clients will appear here once they sign up
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
