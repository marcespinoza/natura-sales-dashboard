import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Phone, Award, ShoppingBag, DollarSign } from 'lucide-react'
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
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Administra las cuentas y saldos de tus clientes
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsWithStats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
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
            <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
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
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
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
          <CardTitle>Todos los Clientes</CardTitle>
          <CardDescription>
            {clientsWithStats.length} {clientsWithStats.length === 1 ? 'cliente registrado' : 'clientes registrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientsWithStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-center">Compras</TableHead>
                  <TableHead className="text-right">Total Gastado</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Adeudo</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsWithStats.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{client.full_name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground">
                          Se unió el {formatDate(client.created_at)}
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
                        <Link href={`/admin/clients/${client.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">Sin clientes aún</p>
              <p className="text-muted-foreground">
                Los clientes aparecerán aquí cuando se registren
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
