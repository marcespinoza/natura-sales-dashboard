'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Award, 
  ShoppingBag, 
  DollarSign, 
  CreditCard,
  Plus,
  Bell,
  Calendar
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import Link from 'next/link'
import { PaymentStatusBadge } from '@/components/dashboard/payment-status-badge'
import type { PaymentStatus } from '@/lib/types'

interface ClientProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  points_balance: number
  created_at: string
}

interface Purchase {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  total_amount: number
  points_earned: number
  created_at: string
  product: { name: string } | null
  payments: { id: string; amount: number; payment_method: string; notes: string | null; created_at: string }[]
}

interface Payment {
  id: string
  purchase_id: string
  amount: number
  payment_method: string
  notes: string | null
  created_at: string
  purchase?: { product?: { name: string } }
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const clientId = params.id as string

  const [client, setClient] = useState<ClientProfile | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>([])

  // Purchase form
  const [selectedProduct, setSelectedProduct] = useState('')
  const [purchaseQuantity, setPurchaseQuantity] = useState('1')
  const [purchaseNotes, setPurchaseNotes] = useState('')

  // Payment dialog
  // Delete purchase
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Notification form
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifType, setNotifType] = useState<string>('info')

  // Stats
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalPaid: 0,
    totalDue: 0,
  })

  useEffect(() => {
    loadClientData()
    loadProducts()
  }, [clientId])

  async function loadProducts() {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('is_active', true)
      .order('name')
    setProducts(data || [])
  }

  async function loadClientData() {
    const supabase = createClient()

    // Get client profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!profile) {
      router.push('/admin')
      return
    }

    setClient(profile)

    // Get all purchases with payments
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select(`
        *,
        product:products(name),
        payments(id, amount, payment_method, notes, created_at)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    setPurchases(purchasesData || [])

    // Get all payments separately for history
    const { data: paymentsData } = await supabase
      .from('payments')
      .select(`
        *,
        purchase:purchases(product:products(name))
      `)
      .in('purchase_id', (purchasesData || []).map(p => p.id))
      .order('created_at', { ascending: false })

    setPayments(paymentsData || [])

    // Calculate stats
    const totalSpent = purchasesData?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0
    const totalPaid = purchasesData?.reduce((sum, p) => {
      return sum + (p.payments?.reduce((s: number, pay: { amount: number }) => s + Number(pay.amount || 0), 0) || 0)
    }, 0) || 0

    console.log('[v0] Stats:', { totalSpent, totalPaid, totalDue: totalSpent - totalPaid, purchasesCount: purchasesData?.length })

    setStats({
      totalSpent,
      totalPaid,
      totalDue: totalSpent - totalPaid,
    })

    setLoading(false)
  }

  async function handleCreatePurchase(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProduct) return

    setSubmitting(true)
    try {
      const supabase = createClient()

      const product = products.find(p => p.id === selectedProduct)
      if (!product) {
        console.error('[v0] Product not found')
        alert('Producto no encontrado')
        setSubmitting(false)
        return
      }

      const quantity = parseInt(purchaseQuantity)
      const totalPrice = product.price * quantity
      
      console.log('[v0] Creating purchase:', { clientId, selectedProduct, quantity, totalPrice })
      
      const { error } = await supabase
        .from('purchases')
        .insert({
          client_id: clientId,
          product_id: selectedProduct,
          quantity: parseInt(purchaseQuantity),
          unit_price: product.price,
          total_amount: totalPrice,
          points_earned: 0, // No points yet, only when fully paid
        })

      if (error) {
        console.error('[v0] Purchase error:', error)
        alert('Error al registrar compra: ' + error.message)
        setSubmitting(false)
        return
      }

      console.log('[v0] Purchase created successfully')

      setPurchaseDialogOpen(false)
      setSelectedProduct('')
      setPurchaseQuantity('1')
      setPurchaseNotes('')
      await loadClientData()
      console.log('[v0] Purchase completed successfully')
    } catch (err) {
      console.error('[v0] Exception:', err)
      alert('Error inesperado: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault()
    setPaymentError('')
    
    if (!selectedPurchase) {
      setPaymentError('Selecciona una compra primero')
      return
    }

    const amount = parseFloat(paymentAmount || '0')
    const alreadyPaid = selectedPurchase.payments?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0
    const totalDue = selectedPurchase.total_amount || 0

    if (amount <= 0) {
      setPaymentError('El monto del pago debe ser mayor a 0')
      return
    }

    if (alreadyPaid + amount > totalDue) {
      const maxAllowed = Math.max(0, totalDue - alreadyPaid)
      setPaymentError(`El pago no puede superar el total. Total: $${totalDue.toFixed(2)}, Ya pagado: $${alreadyPaid.toFixed(2)}, Máximo: $${maxAllowed.toFixed(2)}`)
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('payments')
        .insert({
          purchase_id: selectedPurchase.id,
          amount: amount,
          payment_method: paymentMethod,
          notes: paymentNotes || null,
        })

      if (error) {
        console.error('[v0] Payment error:', error)
        setPaymentError('Error al registrar pago: ' + error.message)
      } else {
        // Check if payment is now complete
        const newTotalPaid = alreadyPaid + amount
        const isNowComplete = newTotalPaid >= totalDue
        
        if (isNowComplete) {
          console.log('[v0] Payment is now complete, awarding points')
          // Get the settings to calculate points
          const settingsData = await supabase
            .from('settings')
            .select('points_percentage')
            .single()
          
          const pointsPercentage = settingsData.data?.points_percentage || 10
          const pointsEarned = Math.floor((totalDue * pointsPercentage) / 100)
          
          // Update the purchase with points earned
          await supabase
            .from('purchases')
            .update({ points_earned: pointsEarned })
            .eq('id', selectedPurchase.id)
          
          // Update points balance
          const { data: profileData } = await supabase
            .from('profiles')
            .select('points_balance')
            .eq('id', clientId)
            .single()
          
          const newBalance = (profileData?.points_balance || 0) + pointsEarned
          await supabase
            .from('profiles')
            .update({ points_balance: newBalance })
            .eq('id', clientId)
          
          console.log('[v0] Points awarded:', pointsEarned)
        }
        
        toast({
          title: 'Éxito',
          description: 'Pago registrado correctamente',
        })
        setPaymentDialogOpen(false)
        setPaymentAmount('')
        setPaymentMethod('cash')
        setPaymentNotes('')
        setSelectedPurchase(null)
        setPaymentError('')
        await loadClientData()
      }
    } catch (err) {
      console.error('[v0] Exception:', err)
      setPaymentError('Error inesperado: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeletePurchase() {
    if (!purchaseToDelete) return

    setIsDeleting(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseToDelete.id)

      if (error) {
        console.error('[v0] Delete error:', error)
        toast({
          title: 'Error',
          description: 'Error al eliminar compra: ' + error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Éxito',
          description: 'Compra eliminada correctamente',
        })
        setDeleteDialogOpen(false)
        setPurchaseToDelete(null)
        await loadClientData()
      }
    } catch (err) {
      console.error('[v0] Exception:', err)
      toast({
        title: 'Error',
        description: 'Error inesperado: ' + (err instanceof Error ? err.message : String(err)),
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSendNotification(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('notifications')
      .insert({
        recipient_id: clientId,
        title: notifTitle,
        message: notifMessage,
        is_global: false,
        notification_type: notifType,
      })

    if (error) {
      alert('Error al enviar notificacion: ' + error.message)
      setSubmitting(false)
      return
    }

    // Also save to notification_history
    await supabase
      .from('notification_history')
      .insert({
        sent_by: user?.id,
        recipient_id: clientId,
        title: notifTitle,
        message: notifMessage,
        notification_type: notifType,
        is_global: false,
      })

    setNotificationDialogOpen(false)
    setNotifTitle('')
    setNotifMessage('')
    setNotifType('info')
    alert('Notificacion enviada correctamente')
    setSubmitting(false)
  }

  function getPaymentStatus(purchase: Purchase): PaymentStatus {
    const paid = purchase.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0
    if (paid >= Number(purchase.total_amount)) return 'paid'
    if (paid > 0) return 'partial'
    return 'pending'
  }

  function getPurchaseAmountDue(purchase: Purchase): number {
    const paid = purchase.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0
    return Number(purchase.total_price) - paid
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!client) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{client.full_name || 'Sin nombre'}</h1>
          <p className="text-muted-foreground">Cliente desde {formatDate(client.created_at)}</p>
        </div>
        <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreatePurchase}>
              <DialogHeader>
                <DialogTitle>Registrar Nueva Compra</DialogTitle>
                <DialogDescription>
                  Agregar una compra para {client.full_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min="1"
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(e.target.value)}
                    required
                  />
                </div>
                {selectedProduct && (
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex justify-between text-sm">
                      <span>Precio unitario:</span>
                      <span>{formatCurrency(products.find(p => p.id === selectedProduct)?.price || 0)}</span>
                    </div>
                    <div className="flex justify-between font-medium mt-1">
                      <span>Total:</span>
                      <span>{formatCurrency((products.find(p => p.id === selectedProduct)?.price || 0) * parseInt(purchaseQuantity || '1'))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>Puntos a ganar:</span>
                      <span>+{Math.floor(((products.find(p => p.id === selectedProduct)?.price || 0) * parseInt(purchaseQuantity || '1')) / 10)}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting || !selectedProduct}>
                  {submitting ? 'Registrando...' : 'Registrar Compra'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Bell className="h-4 w-4 mr-2" />
              Enviar Notificacion
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSendNotification}>
              <DialogHeader>
                <DialogTitle>Enviar Notificacion</DialogTitle>
                <DialogDescription>
                  Envia una notificacion a {client.full_name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={notifType} onValueChange={setNotifType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Informacion</SelectItem>
                      <SelectItem value="payment">Recordatorio de pago</SelectItem>
                      <SelectItem value="promo">Promocion</SelectItem>
                      <SelectItem value="points">Puntos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Titulo</Label>
                  <Input
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Titulo de la notificacion"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mensaje</Label>
                  <Textarea
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    rows={3}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNotificationDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Client Info & Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacion de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.email || 'Sin email'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.phone || 'Sin telefono'}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.address || 'Sin direccion'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{client.points_balance} puntos</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Estado de Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total compras:</span>
                <span className="font-medium">{formatCurrency(stats.totalSpent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total pagado:</span>
                <span className="font-medium text-status-paid">{formatCurrency(stats.totalPaid)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-sm font-medium">Saldo pendiente:</span>
                <span className={`font-bold ${(stats.totalSpent - stats.totalPaid) > 0 ? 'text-status-pending' : 'text-status-paid'}`}>
                  {formatCurrency(Math.max(0, stats.totalSpent - stats.totalPaid))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total de pedidos:</span>
                <span className="font-medium">{purchases.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pagos realizados:</span>
                <span className="font-medium">{payments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Puntos acumulados:</span>
                <span className="font-medium">{client.points_balance}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Purchases and Payments */}
      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="purchases" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            Compras ({purchases.length})
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Historial de Pagos ({payments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Compras</CardTitle>
              <CardDescription>Todos los productos que ha comprado este cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Pagado</TableHead>
                      <TableHead className="text-right">Pendiente</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => {
                      const status = getPaymentStatus(purchase)
                      const amountDue = getPurchaseAmountDue(purchase)
                      const paid = purchase.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0

                      return (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDate(purchase.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{purchase.product?.name || 'Producto'}</p>
                            {purchase.notes && (
                              <p className="text-xs text-muted-foreground">{purchase.notes}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{purchase.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(purchase.total_amount)}
                          </TableCell>
                          <TableCell className="text-right text-status-paid">
                            {formatCurrency(paid)}
                          </TableCell>
                          <TableCell className={`text-right ${amountDue > 0 ? 'text-status-pending font-medium' : ''}`}>
                            {formatCurrency(amountDue)}
                          </TableCell>
                          <TableCell className="text-center">
                            <PaymentStatusBadge status={status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {status !== 'paid' && (
                                <Dialog open={paymentDialogOpen && selectedPurchase?.id === purchase.id} onOpenChange={(open) => {
                                  setPaymentDialogOpen(open)
                                  if (open) {
                                    setSelectedPurchase(purchase)
                                    setPaymentAmount(amountDue.toString())
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <Plus className="h-4 w-4 mr-1" />
                                      Pago
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                  <form onSubmit={handleRegisterPayment}>
                                    <DialogHeader>
                                      <DialogTitle>Registrar Pago</DialogTitle>
                                      <DialogDescription>
                                        {purchase.product?.name} - Pendiente: {formatCurrency(amountDue)}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Total Compra:</span>
                                          <span className="font-medium">{formatCurrency(purchase.total_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Ya Pagado:</span>
                                          <span className="font-medium">{formatCurrency((purchase.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0))}</span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between text-base">
                                          <span className="font-semibold">Pendiente:</span>
                                          <span className="font-bold text-primary">{formatCurrency(amountDue)}</span>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Monto a Pagar</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0.01"
                                          max={amountDue}
                                          value={paymentAmount}
                                          onChange={(e) => setPaymentAmount(e.target.value)}
                                          required
                                          placeholder="0.00"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Máximo: {formatCurrency(amountDue)}
                                        </p>
                                        {paymentError && (
                                          <p className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded">
                                            {paymentError}
                                          </p>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Método de Pago</Label>
                                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="cash">Efectivo</SelectItem>
                                            <SelectItem value="transfer">Transferencia</SelectItem>
                                            <SelectItem value="card">Tarjeta</SelectItem>
                                            <SelectItem value="other">Otro</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Notas (opcional)</Label>
                                        <Textarea
                                          value={paymentNotes}
                                          onChange={(e) => setPaymentNotes(e.target.value)}
                                          placeholder="Notas adicionales..."
                                          rows={2}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                                        Cancelar
                                      </Button>
                                      <Button 
                                        type="submit" 
                                        disabled={submitting}
                                      >
                                        {submitting ? 'Registrando...' : 'Registrar Pago'}
                                      </Button>
                                    </DialogFooter>
                                  </form>
                                </DialogContent>
                              </Dialog>
                              )}
                              <Dialog open={deleteDialogOpen && purchaseToDelete?.id === purchase.id} onOpenChange={(open) => {
                                setDeleteDialogOpen(open)
                                if (open) {
                                  setPurchaseToDelete(purchase)
                                }
                              }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    Eliminar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Eliminar Compra</DialogTitle>
                                    <DialogDescription>
                                      ¿Está seguro de que desea eliminar esta compra? Esta acción no se puede deshacer.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p className="text-sm"><span className="font-medium">Producto:</span> {purchase.product?.name}</p>
                                    <p className="text-sm"><span className="font-medium">Monto:</span> {formatCurrency(purchase.total_amount)}</p>
                                  </div>
                                  <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                      Cancelar
                                    </Button>
                                    <Button type="button" variant="destructive" onClick={handleDeletePurchase} disabled={isDeleting}>
                                      {isDeleting ? 'Eliminando...' : 'Eliminar'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Sin compras aun</p>
                  <p className="text-muted-foreground">
                    Este cliente no tiene compras registradas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Todos los pagos realizados por este cliente</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha y Hora</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Metodo</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDateTime(payment.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>{payment.purchase?.product?.name || 'Producto'}</TableCell>
                        <TableCell className="text-right font-medium text-status-paid">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.payment_method === 'cash' && 'Efectivo'}
                            {payment.payment_method === 'transfer' && 'Transferencia'}
                            {payment.payment_method === 'card' && 'Tarjeta'}
                            {payment.payment_method === 'other' && 'Otro'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Sin pagos registrados</p>
                  <p className="text-muted-foreground">
                    Los pagos realizados apareceran aqui
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
