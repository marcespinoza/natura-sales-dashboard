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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ShoppingCart, ArrowLeft, Check, ChevronsUpDown } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Profile, Product } from '@/lib/types'
import Link from 'next/link'

export default function NewSalePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [clientId, setClientId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [clientOpen, setClientOpen] = useState(false)
  const [productOpen, setProductOpen] = useState(false)

  // Obtener clientes
  const { data: clients } = useSWR<Profile[]>('admin-clients', async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name')
    return data || []
  })

  // Obtener productos
  const { data: products } = useSWR<Product[]>('admin-products', async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name')
    return data || []
  })

  const selectedProduct = products?.find((p) => p.id === productId)
  const totalPrice = selectedProduct ? selectedProduct.price * parseInt(quantity || '0') : 0
  const pointsEarned = Math.floor(totalPrice)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!clientId || !productId || !quantity) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    setIsSaving(true)

    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        client_id: clientId,
        product_id: productId,
        quantity: parseInt(quantity),
        unit_price: selectedProduct?.price || 0,
        total_price: totalPrice,
        points_earned: pointsEarned,
        notes: notes || null,
      })
      .select()
      .single()

    if (purchaseError) {
      toast.error('Error al crear la venta')
      setIsSaving(false)
      return
    }

    // Agregar puntos al cliente
    if (pointsEarned > 0) {
      await supabase
        .from('points_ledger')
        .insert({
          user_id: clientId,
          change: pointsEarned,
          reason: `Compra: ${selectedProduct?.name}`,
          purchase_id: purchase.id,
        })

      // Actualizar balance de puntos del cliente
      await supabase.rpc('increment_points', {
        user_id: clientId,
        points_change: pointsEarned,
      })
    }

    toast.success('Venta registrada exitosamente')
    router.push('/admin/sales')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/sales">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Venta</h1>
          <p className="text-muted-foreground">
            Registra una nueva venta de producto
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Detalles de la Venta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Detalles de la Venta
              </CardTitle>
              <CardDescription>
                Ingresa la información de la venta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selección de Cliente */}
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientOpen}
                      className="w-full justify-between"
                    >
                      {clientId
                        ? clients?.find((c) => c.id === clientId)?.full_name || 'Seleccionar cliente...'
                        : 'Seleccionar cliente...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar clientes..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        <CommandGroup>
                          {clients?.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={client.full_name || client.id}
                              onSelect={() => {
                                setClientId(client.id)
                                setClientOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  clientId === client.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              {client.full_name || 'Sin nombre'}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selección de Producto */}
              <div className="space-y-2">
                <Label>Producto *</Label>
                <Popover open={productOpen} onOpenChange={setProductOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productOpen}
                      className="w-full justify-between"
                    >
                      {productId
                        ? products?.find((p) => p.id === productId)?.name || 'Seleccionar producto...'
                        : 'Seleccionar producto...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar productos..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron productos.</CommandEmpty>
                        <CommandGroup>
                          {products?.map((product) => (
                            <CommandItem
                              key={product.id}
                              value={product.name}
                              onSelect={() => {
                                setProductId(product.id)
                                setProductOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  productId === product.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <div className="flex-1">
                                <p>{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(product.price)}
                                </p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProduct ? (
                <>
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Producto</span>
                      <span className="font-medium">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precio Unitario</span>
                      <span>{formatCurrency(selectedProduct.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cantidad</span>
                      <span>{quantity || 0}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Puntos a Ganar</span>
                      <span className="text-chart-3 font-medium">+{pointsEarned}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-muted p-8 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Selecciona un producto para ver el resumen
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSaving || !clientId || !productId}
              >
                {isSaving ? <Spinner className="mr-2" /> : null}
                Registrar Venta
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
