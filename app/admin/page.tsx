'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Phone, Award, Search, ArrowUpDown, DollarSign, ShoppingBag } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'
import Link from 'next/link'

interface ClientWithStats {
  id: string
  full_name: string | null
  phone: string | null
  email?: string
  points_balance: number
  created_at: string
  totalSpent: number
  totalPaid: number
  totalDue: number
  purchaseCount: number
  monthlyPurchases: number
}

type SortOption = 'name-asc' | 'name-desc' | 'debt-desc' | 'debt-asc' | 'purchases-desc' | 'monthly-desc' | 'recent'

export default function AdminPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([])
  const [filteredClients, setFilteredClients] = useState<ClientWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [totals, setTotals] = useState({
    totalClients: 0,
    totalSales: 0,
    totalCollected: 0,
    totalPending: 0,
  })

  useEffect(() => {
    loadClients()
  }, [])

  useEffect(() => {
    filterAndSortClients()
  }, [clients, searchTerm, sortBy])

  async function loadClients() {
    const supabase = createClient()

    // Get all clients (non-admins)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')

    // Get all admins to exclude them
    const { data: admins } = await supabase
      .from('admins')
      .select('email')

    const adminEmails = new Set((admins || []).map(a => a.email.toLowerCase()))

    console.log('[v0] Profiles loaded:', profiles?.length, profiles)
    console.log('[v0] Admin emails:', Array.from(adminEmails))

    // Get all purchases with payments
    const { data: purchases } = await supabase
      .from('purchases')
      .select(`
        client_id,
        total_price,
        created_at,
        payments(amount)
      `)

    // Get start of current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Calculate stats for each client (exclude admins)
    const clientsWithStats: ClientWithStats[] = (profiles || [])
      .filter(p => {
        // If profile has email, check if it's NOT an admin
        if (p.email) {
          return !adminEmails.has(p.email.toLowerCase())
        }
        // If no email in profile, include them (they're clients)
        return true
      })
      .map(client => {
        const clientPurchases = purchases?.filter(p => p.client_id === client.id) || []
        const totalSpent = clientPurchases.reduce((sum, p) => sum + Number(p.total_price), 0)
        const totalPaid = clientPurchases.reduce((sum, p) => {
          const paid = p.payments?.reduce((s: number, pay: { amount: number }) => s + Number(pay.amount), 0) || 0
          return sum + paid
        }, 0)
        const monthlyPurchases = clientPurchases
          .filter(p => new Date(p.created_at) >= startOfMonth)
          .reduce((sum, p) => sum + Number(p.total_price), 0)

        return {
          id: client.id,
          full_name: client.full_name,
          phone: client.phone,
          email: client.email,
          points_balance: client.points_balance || 0,
          created_at: client.created_at,
          totalSpent,
          totalPaid,
          totalDue: totalSpent - totalPaid,
          purchaseCount: clientPurchases.length,
          monthlyPurchases,
        }
      })

    console.log('[v0] Clients with stats (after filtering):', clientsWithStats.length, clientsWithStats)
    
    setClients(clientsWithStats)
    setTotals({
      totalClients: clientsWithStats.length,
      totalSales: clientsWithStats.reduce((sum, c) => sum + c.totalSpent, 0),
      totalCollected: clientsWithStats.reduce((sum, c) => sum + c.totalPaid, 0),
      totalPending: clientsWithStats.reduce((sum, c) => sum + c.totalDue, 0),
    })
    setLoading(false)
  }

  function filterAndSortClients() {
    let filtered = [...clients]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.full_name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.email?.toLowerCase().includes(term)
      )
    }

    // Sort
    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
        break
      case 'name-desc':
        filtered.sort((a, b) => (b.full_name || '').localeCompare(a.full_name || ''))
        break
      case 'debt-desc':
        filtered.sort((a, b) => b.totalDue - a.totalDue)
        break
      case 'debt-asc':
        filtered.sort((a, b) => a.totalDue - b.totalDue)
        break
      case 'purchases-desc':
        filtered.sort((a, b) => b.totalSpent - a.totalSpent)
        break
      case 'monthly-desc':
        filtered.sort((a, b) => b.monthlyPurchases - a.monthlyPurchases)
        break
      case 'recent':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
    }

    setFilteredClients(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis Clientes</h1>
        <p className="text-muted-foreground">
          Gestiona las cuentas y saldos de tus clientes Natura
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalSales)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobrado</CardTitle>
            <DollarSign className="h-4 w-4 text-status-paid" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-paid">{formatCurrency(totals.totalCollected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente</CardTitle>
            <DollarSign className="h-4 w-4 text-status-pending" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-status-pending">{formatCurrency(totals.totalPending)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <div>
              <CardTitle>Listado de Clientes</CardTitle>
              <CardDescription>
                {filteredClients.length} {filteredClients.length === 1 ? 'cliente' : 'clientes'}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-[250px]"
                />
              </div>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                  <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                  <SelectItem value="debt-desc">Mayor deuda</SelectItem>
                  <SelectItem value="debt-asc">Menor deuda</SelectItem>
                  <SelectItem value="purchases-desc">Mas compras</SelectItem>
                  <SelectItem value="monthly-desc">Compras del mes</SelectItem>
                  <SelectItem value="recent">Mas recientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-center">Compras</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Adeudo</TableHead>
                    <TableHead className="text-center">Puntos</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/admin/clients/${client.id}`} className="block">
                          <p className="font-medium">{client.full_name || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">{client.email}</p>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {client.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {client.phone}
                          </div>
                        )}
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
                      <TableCell className={`text-right font-medium ${client.totalDue > 0 ? 'text-status-pending' : 'text-status-paid'}`}>
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
                          <Link href={`/admin/clients/${client.id}`}>Ver detalle</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              {searchTerm ? (
                <>
                  <p className="text-lg font-medium">Sin resultados</p>
                  <p className="text-muted-foreground">
                    No se encontraron clientes con "{searchTerm}"
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium">Sin clientes aun</p>
                  <p className="text-muted-foreground">
                    Los clientes apareceran aqui cuando se registren
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
