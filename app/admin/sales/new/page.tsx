'use client'

import { useState, useEffect } from 'react'
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

  // Fetch clients
  const { data: clients } = useSWR<Profile[]>('admin-clients', async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name')
    return data || []
  })

  // Fetch products
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
      toast.error('Please fill in all required fields')
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
      toast.error('Failed to create sale')
      setIsSaving(false)
      return
    }

    // Add points to client
    if (pointsEarned > 0) {
      await supabase
        .from('points_ledger')
        .insert({
          user_id: clientId,
          change: pointsEarned,
          reason: `Purchase: ${selectedProduct?.name}`,
          purchase_id: purchase.id,
        })

      // Update client's points balance
      await supabase.rpc('increment_points', {
        user_id: clientId,
        points_change: pointsEarned,
      })
    }

    toast.success('Sale recorded successfully')
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
          <h1 className="text-2xl font-bold tracking-tight">New Sale</h1>
          <p className="text-muted-foreground">
            Record a new product sale
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sale Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Sale Details
              </CardTitle>
              <CardDescription>
                Enter the sale information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label>Client *</Label>
                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientOpen}
                      className="w-full justify-between"
                    >
                      {clientId
                        ? clients?.find((c) => c.id === clientId)?.full_name || 'Select client...'
                        : 'Select client...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search clients..." />
                      <CommandList>
                        <CommandEmpty>No clients found.</CommandEmpty>
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
                              {client.full_name || 'No name'}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Product Selection */}
              <div className="space-y-2">
                <Label>Product *</Label>
                <Popover open={productOpen} onOpenChange={setProductOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={productOpen}
                      className="w-full justify-between"
                    >
                      {productId
                        ? products?.find((p) => p.id === productId)?.name || 'Select product...'
                        : 'Select product...'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search products..." />
                      <CommandList>
                        <CommandEmpty>No products found.</CommandEmpty>
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

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
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
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProduct ? (
                <>
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product</span>
                      <span className="font-medium">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unit Price</span>
                      <span>{formatCurrency(selectedProduct.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity</span>
                      <span>{quantity || 0}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold">{formatCurrency(totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Points Earned</span>
                      <span className="text-chart-3 font-medium">+{pointsEarned}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-muted p-8 text-center">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Select a product to see the summary
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isSaving || !clientId || !productId}
              >
                {isSaving ? <Spinner className="mr-2" /> : null}
                Record Sale
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
