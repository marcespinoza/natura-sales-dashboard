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

  // Adjust points
  const [adjustPointsDialogOpen, setAdjustPointsDialogOpen] = useState(false)
  const [pointsAdjustment, setPointsAdjustment] = useState(0)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false)

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

    console.log('[v0] Loaded profile with points_balance:', profile.points_balance)
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

      const { data: paymentData, error } = await supabase
        .from('payments')
        .insert({
          purchase_id: selectedPurchase.id,
          amount: amount,
          payment_method: paymentMethod,
          notes: paymentNotes || null,
        })
        .select()

      console.log('[v0] Payment insert result - error:', error, 'data:', paymentData)
      
      if (error) {
        console.error('[v0] Payment error:', error)
        setPaymentError('Error al registrar pago: ' + error.message)
      } else {
        console.log('[v0] Payment successful, now calculating points...')
        // Recalculate from DB to get accurate totals
        const { data: freshPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('purchase_id', selectedPurchase.id)

        const realTotalPaid = (freshPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0)
        const isNowComplete = realTotalPaid >= totalDue

        // Award points on each payment proportionally
        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('points_percentage')
          .limit(1)
          .maybeSingle()

        console.log('[v0] Settings data:', settingsData, 'Error:', settingsError)

        const pointsPercentage = settingsData?.points_percentage || 10
        // Points for THIS payment only (avoid double-counting)
        const pointsForThisPayment = Math.floor((amount * pointsPercentage) / 100)

        console.log('[v0] Points calculation:', { amount, pointsPercentage, pointsForThisPayment })

        if (pointsForThisPayment > 0) {
          // Add to points_ledger for tracking
          const { error: ledgerError } = await supabase
            .from('points_ledger')
            .insert({
              client_id: clientId,
              purchase_id: selectedPurchase.id,
              points: pointsForThisPayment,
              description: `Puntos por pago de ${formatCurrency(amount)}`
            })

          console.log('[v0] Points ledger insert error:', ledgerError)

          // Update purchase points_earned by adding new points
          const { error: purchaseError } = await supabase
            .from('purchases')
            .update({ points_earned: (selectedPurchase.points_earned || 0) + pointsForThisPayment })
            .eq('id', selectedPurchase.id)

          console.log('[v0] Purchase points update error:', purchaseError)

          // Update client points balance
          const { data: profileData, error: profileFetchError } = await supabase
            .from('profiles')
            .select('points_balance')
            .eq('id', clientId)
            .single()

          console.log('[v0] Profile fetch:', profileData, 'Error:', profileFetchError)

          // Update client points balance using SECURITY DEFINER function
          const newBalance = (profileData?.points_balance || 0) + pointsForThisPayment
          const { error: profileUpdateError } = await supabase
            .rpc('update_client_points', {
              client_id: clientId,
              points_amount: newBalance
            })

          console.log('[v0] Profile update to', newBalance, 'Error:', profileUpdateError)
        }

        if (isNowComplete) {
          // Mark purchase status as paid if needed
          await supabase
            .from('purchases')
            .update({ status: 'paid' })
            .eq('id', selectedPurchase.id)
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

      // Use SECURITY DEFINER function to delete purchase and all related records
      const { error } = await supabase
        .rpc('delete_purchase_cascade', { purchase_id: purchaseToDelete.id })

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

  async function handleAdjustPoints() {
    if (!client) return
    if (pointsAdjustment === 0) {
      toast({
        title: 'Error',
        description: 'El ajuste de puntos debe ser diferente a 0',
        variant: 'destructive',
      })
      return
    }

    setIsAdjustingPoints(true)
    try {
      const supabase = createClient()
      const newBalance = Math.max(0, (client.points_balance || 0) + pointsAdjustment)

      const { error } = await supabase
        .from('profiles')
        .update({ points_balance: newBalance })
        .eq('id', clientId)

      if (error) {
        toast({
          title: 'Error',
          description: 'Error al ajustar puntos: ' + error.message,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Éxito',
          description: `Puntos ajustados correctamente (${pointsAdjustment > 0 ? '+' : ''}${pointsAdjustment})`,
        })
        setAdjustPointsDialogOpen(false)
        setPointsAdjustment(0)
        setAdjustmentReason('')
        await loadClientData()
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error inesperado: ' + (err instanceof Error ? err.message : String(err)),
        variant: 'destructive',
      })
    } finally {
      setIsAdjustingPoints(false)
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
    const paid = purchase.payments?.reduce((s, p) => s + Number(p.amount || 0), 0) || 0
    const total = Number(purchase.total_amount || 0)
    return Math.max(0, total - paid)
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
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Puntos acumulados:</span>
                <span className="font-medium">{client.points_balance}</span>
              </div>
            </div>
            <Button 
              onClick={() => setAdjustPointsDialogOpen(true)}
              variant="outline"
              className="w-full mt-4"
            >
              Ajustar Puntos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Adjust Points Dialog */}
      <Dialog open={adjustPointsDialogOpen} onOpenChange={setAdjustPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Puntos del Cliente</DialogTitle>
            <DialogDescription>
              Puntos actuales: {client?.points_balance || 0}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment">Cantidad de Puntos</Label>
              <Input
                id="adjustment"
                type="number"
                placeholder="Ej: +100 o -50"
                value={pointsAdjustment}
                onChange={(e) => setPointsAdjustment(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Los puntos nuevos serán: {Math.max(0, (client?.points_balance || 0) + pointsAdjustment)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Razón del Ajuste (opcional)</Label>
              <Input
                id="reason"
                placeholder="Ej: Compensación por error"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAdjustPointsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleAdjustPoints} disabled={isAdjustingPoints}>
              {isAdjustingPoints ? 'Ajustando...' : 'Confirmar Ajuste'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <CardDescription>Todos los productos que ha comprado este cliente, agrupados por mes</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length > 0 ? (
                <div className="space-y-6">
                  {(() => {
                    // Group purchases by month
                    const grouped: Record<string, Purchase[]> = {}
                    purchases.forEach((p) => {
                      const key = new Date(p.created_at).toLocaleString('es-MX', { year: 'numeric', month: 'long' })
                      if (!grouped[key]) grouped[key] = []
                      grouped[key].push(p)
                    })
                    return Object.entries(grouped).map(([month, monthPurchases]) => (
                      <div key={month}>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 capitalize">{month}</h3>
                        <div className="space-y-3">
                          {monthPurchases.map((purchase) => {
                            const status = getPaymentStatus(purchase)
                            const amountDue = getPurchaseAmountDue(purchase)
                            const paid = purchase.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0
                            return (
                              <div key={purchase.id} className="border rounded-lg overflow-hidden">
                                {/* Purchase row */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 bg-muted/30">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(purchase.created_at)}</span>
                                    <span className="font-medium truncate">{purchase.product?.name || 'Producto'}</span>
                                    <span className="text-sm text-muted-foreground">x{purchase.quantity}</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-sm">Total: <span className="font-medium">{formatCurrency(purchase.total_amount)}</span></span>
                                    <span className="text-sm text-status-paid">Pagado: <span className="font-medium">{formatCurrency(paid)}</span></span>
                                    {amountDue > 0 && <span className="text-sm text-status-pending">Pendiente: <span className="font-medium">{formatCurrency(amountDue)}</span></span>}
                                    <PaymentStatusBadge status={status} />
                                  </div>
                                  <div className="flex gap-2 shrink-0">
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
                                            <span className="font-medium">{formatCurrency(paid)}</span>
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
                                          <p className="text-xs text-muted-foreground">Máximo: {formatCurrency(amountDue)}</p>
                                          {paymentError && (
                                            <p className="text-sm font-medium text-destructive bg-destructive/10 p-2 rounded">
                                              {paymentError}
                                            </p>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Método de Pago</Label>
                                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                                          <Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Notas adicionales..." rows={2} />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={submitting}>{submitting ? 'Registrando...' : 'Registrar Pago'}</Button>
                                      </DialogFooter>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                              )}
                              <Dialog open={deleteDialogOpen && purchaseToDelete?.id === purchase.id} onOpenChange={(open) => {
                                setDeleteDialogOpen(open)
                                if (open) setPurchaseToDelete(purchase)
                              }}>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="destructive">Eliminar</Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Eliminar Compra</DialogTitle>
                                    <DialogDescription>¿Está seguro de que desea eliminar esta compra? Esta acción no se puede deshacer.</DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p className="text-sm"><span className="font-medium">Producto:</span> {purchase.product?.name}</p>
                                    <p className="text-sm"><span className="font-medium">Monto:</span> {formatCurrency(purchase.total_amount)}</p>
                                  </div>
                                  <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                                    <Button type="button" variant="destructive" onClick={handleDeletePurchase} disabled={isDeleting}>{isDeleting ? 'Eliminando...' : 'Eliminar'}</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>

                                {/* Payments for this purchase */}
                                {purchase.payments && purchase.payments.length > 0 && (
                                  <div className="px-4 pb-3 border-t bg-background">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-3 mb-2">Pagos registrados</p>
                                    <div className="space-y-1">
                                      {purchase.payments.map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between text-sm py-1">
                                          <div className="flex items-center gap-3">
                                            <span className="text-muted-foreground">{formatDateTime(payment.created_at)}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {payment.payment_method === 'cash' && 'Efectivo'}
                                              {payment.payment_method === 'transfer' && 'Transferencia'}
                                              {payment.payment_method === 'card' && 'Tarjeta'}
                                              {payment.payment_method === 'other' && 'Otro'}
                                            </Badge>
                                            {payment.notes && <span className="text-muted-foreground">{payment.notes}</span>}
                                          </div>
                                          <span className="font-medium text-status-paid">{formatCurrency(payment.amount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Sin compras aun</p>
                  <p className="text-muted-foreground">Este cliente no tiene compras registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>Todos los pagos realizados por este cliente, agrupados por mes</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-6">
                  {(() => {
                    const grouped: Record<string, Payment[]> = {}
                    payments.forEach((p) => {
                      const key = new Date(p.created_at).toLocaleString('es-MX', { year: 'numeric', month: 'long' })
                      if (!grouped[key]) grouped[key] = []
                      grouped[key].push(p)
                    })
                    return Object.entries(grouped).map(([month, monthPayments]) => (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide capitalize">{month}</h3>
                          <span className="text-sm font-medium text-status-paid">
                            Total: {formatCurrency(monthPayments.reduce((s, p) => s + Number(p.amount), 0))}
                          </span>
                        </div>
                        <div className="border rounded-lg divide-y">
                          {monthPayments.map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between px-4 py-3 text-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(payment.created_at)}</span>
                                <span className="font-medium truncate">{payment.purchase?.product?.name || 'Producto'}</span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {payment.payment_method === 'cash' && 'Efectivo'}
                                  {payment.payment_method === 'transfer' && 'Transferencia'}
                                  {payment.payment_method === 'card' && 'Tarjeta'}
                                  {payment.payment_method === 'other' && 'Otro'}
                                </Badge>
                              </div>
                              <span className="font-medium text-status-paid shrink-0 ml-4">{formatCurrency(payment.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">Sin pagos registrados</p>
                  <p className="text-muted-foreground">Los pagos realizados apareceran aqui</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
