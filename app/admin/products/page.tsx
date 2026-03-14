'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Package, Plus, Pencil, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [productLine, setProductLine] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [sizeMl, setSizeMl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [active, setActive] = useState(true)

  const supabase = createClient()

  const { data: products, mutate, isLoading } = useSWR<Product[]>(
    'products',
    async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('name')
      return data || []
    }
  )

  // Filter products by search
  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  function resetForm() {
    setName('')
    setSku('')
    setProductLine('')
    setDescription('')
    setPrice('')
    setCategory('')
    setSizeMl('')
    setImageUrl('')
    setActive(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setName(product.name)
    setSku(product.sku || '')
    setProductLine(product.product_line || '')
    setDescription(product.description || '')
    setPrice(product.price.toString())
    setCategory(product.category || '')
    setSizeMl(product.size_ml?.toString() || '')
    setImageUrl(product.image_url || '')
    setActive(product.active)
  }

  async function handleSave() {
    if (!name || !price) {
      toast.error('Nombre y precio son requeridos')
      return
    }

    setIsSaving(true)

    const productData = {
      name,
      sku: sku || null,
      product_line: productLine || null,
      description: description || null,
      price: parseFloat(price),
      category: category || null,
      size_ml: sizeMl ? parseInt(sizeMl) : null,
      image_url: imageUrl || null,
      active,
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)

      if (error) {
        toast.error('Error al actualizar producto')
      } else {
        toast.success('Producto actualizado')
        setEditingProduct(null)
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert(productData)

      if (error) {
        toast.error('Error al agregar producto')
      } else {
        toast.success('Producto agregado')
        setIsAddOpen(false)
      }
    }

    resetForm()
    setIsSaving(false)
    mutate()
  }

  const ProductForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Producto *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej., Aceite Esencial - Lavanda"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="ej., NAT-AE-001"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product_line">Línea del Producto</Label>
          <Input
            id="product_line"
            value={productLine}
            onChange={(e) => setProductLine(e.target.value)}
            placeholder="ej., Esenciales, Skincare, Capilar"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size_ml">Tamaño (ml)</Label>
          <Input
            id="size_ml"
            type="number"
            min="0"
            value={sizeMl}
            onChange={(e) => setSizeMl(e.target.value)}
            placeholder="ej., 30"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="image_url">URL de Imagen</Label>
        <Input
          id="image_url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
        />
        {imageUrl && (
          <div className="mt-2 relative w-full h-40 rounded-lg overflow-hidden border">
            <img 
              src={imageUrl} 
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E'
              }}
            />
          </div>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Precio *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="ej., Aceites Esenciales"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción del producto..."
          rows={3}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="active"
          checked={active}
          onCheckedChange={setActive}
        />
        <Label htmlFor="active">Activo (visible en lista de productos)</Label>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            Administra tu catálogo de productos Natura
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              <DialogDescription>
                Agrega un nuevo producto a tu catálogo
              </DialogDescription>
            </DialogHeader>
            <ProductForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Spinner className="mr-2" /> : null}
                Agregar Producto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Productos</CardTitle>
          <CardDescription>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Línea</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.product_line || '-'}
                    </TableCell>
                    <TableCell>
                      {product.size_ml ? `${product.size_ml} ml` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.active ? 'default' : 'secondary'}>
                        {product.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog open={editingProduct?.id === product.id} onOpenChange={(open) => {
                        if (!open) {
                          setEditingProduct(null)
                          resetForm()
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Editar Producto</DialogTitle>
                            <DialogDescription>
                              Actualiza la información del producto
                            </DialogDescription>
                          </DialogHeader>
                          <ProductForm />
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setEditingProduct(null)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                              {isSaving ? <Spinner className="mr-2" /> : null}
                              Guardar Cambios
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No se encontraron productos</p>
              <p className="text-muted-foreground">
                {searchQuery ? 'Prueba con otro término de búsqueda' : 'Agrega tu primer producto para comenzar'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
