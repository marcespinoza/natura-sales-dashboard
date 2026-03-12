'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { User, Mail, Phone, MapPin, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setEmail(user.email || '')

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setPhone(profileData.phone || '')
        setAddress(profileData.address || '')
      }
      
      setIsLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone || null,
        address: address || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setIsSaving(false)

    if (error) {
      toast.error('Error al actualizar perfil')
    } else {
      toast.success('Perfil actualizado correctamente')
      router.refresh()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Administra la información de tu cuenta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza los detalles de tu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="María García"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  El correo no se puede cambiar
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Número de Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 (55) 1234-5678"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle Principal 123, Col. Centro, Ciudad, CP 12345"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Spinner className="mr-2" /> : null}
                Guardar Cambios
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado de la Cuenta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-paid/10">
                  <CheckCircle className="h-5 w-5 text-status-paid" />
                </div>
                <div>
                  <p className="font-medium">Cuenta Activa</p>
                  <p className="text-sm text-muted-foreground">
                    Tu cuenta está en buen estado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Correo Verificado</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {phone ? (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{phone}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin número de teléfono agregado</p>
              )}
              
              {address ? (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{address}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin dirección agregada</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
