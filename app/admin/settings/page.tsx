'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { User, Shield, UserPlus, Trash2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Admin {
  id: string
  email: string
  added_by: string | null
  created_at: string
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Admin management
  const [admins, setAdmins] = useState<Admin[]>([])
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      setEmail(user.email || '')

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setPhone(profileData.phone || '')
      }

      // Load admins list
      const { data: adminsData } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: true })

      if (adminsData) {
        setAdmins(adminsData)
      }
      
      setIsLoading(false)
    }

    loadData()
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    setIsSaving(false)

    if (error) {
      toast.error('Error al actualizar configuración')
    } else {
      toast.success('Configuración actualizada correctamente')
      router.refresh()
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault()
    
    if (!newAdminEmail.trim()) {
      toast.error('Ingresa un correo electrónico')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newAdminEmail)) {
      toast.error('Ingresa un correo electrónico válido')
      return
    }

    setIsAddingAdmin(true)

    // Check if already admin
    const existingAdmin = admins.find(a => a.email.toLowerCase() === newAdminEmail.toLowerCase())
    if (existingAdmin) {
      toast.error('Este correo ya es administrador')
      setIsAddingAdmin(false)
      return
    }

    const { error } = await supabase
      .from('admins')
      .insert({
        email: newAdminEmail.toLowerCase().trim(),
        added_by: email,
      })

    setIsAddingAdmin(false)

    if (error) {
      toast.error('Error al agregar administrador: ' + error.message)
    } else {
      toast.success('Administrador agregado correctamente')
      setNewAdminEmail('')
      
      // Reload admins list
      const { data: adminsData } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: true })

      if (adminsData) {
        setAdmins(adminsData)
      }
    }
  }

  async function handleRemoveAdmin(adminId: string, adminEmail: string) {
    // Prevent removing yourself
    if (adminEmail === email) {
      toast.error('No puedes eliminarte a ti mismo como administrador')
      return
    }

    // Prevent removing the last admin
    if (admins.length <= 1) {
      toast.error('Debe haber al menos un administrador')
      return
    }

    setRemovingAdminId(adminId)

    const { error } = await supabase
      .from('admins')
      .delete()
      .eq('id', adminId)

    setRemovingAdminId(null)

    if (error) {
      toast.error('Error al eliminar administrador: ' + error.message)
    } else {
      toast.success('Administrador eliminado correctamente')
      setAdmins(admins.filter(a => a.id !== adminId))
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
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y gestiona los administradores del sistema
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil de Admin
            </CardTitle>
            <CardDescription>
              Actualiza la información de tu cuenta
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
                  placeholder="Nombre del Admin"
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

              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Spinner className="mr-2" /> : null}
                Guardar Cambios
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Estado de la Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Administrador</p>
                  <p className="text-sm text-muted-foreground">
                    Acceso completo a todas las funciones
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rol</span>
                <span className="font-medium">Administrador</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cuenta Creada</span>
                <span className="font-medium">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('es-MX')
                    : '-'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Gestión de Administradores
          </CardTitle>
          <CardDescription>
            Agrega o elimina administradores del sistema. Los administradores tienen acceso completo al panel de administración.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new admin form */}
          <form onSubmit={handleAddAdmin} className="flex gap-3">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="correo@ejemplo.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isAddingAdmin}>
              {isAddingAdmin ? <Spinner className="mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Agregar Admin
            </Button>
          </form>

          {/* Admins list */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              Administradores actuales ({admins.length})
            </h4>
            <div className="divide-y rounded-lg border">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{admin.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {admin.email === email ? (
                          <span className="text-primary">(Tú)</span>
                        ) : admin.added_by ? (
                          `Agregado por ${admin.added_by}`
                        ) : (
                          'Admin inicial'
                        )}
                        {' • '}
                        {new Date(admin.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                  </div>
                  
                  {admin.email !== email && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={removingAdminId === admin.id}
                        >
                          {removingAdminId === admin.id ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar administrador?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Estás a punto de eliminar a <strong>{admin.email}</strong> como administrador. 
                            Esta persona perderá acceso al panel de administración inmediatamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveAdmin(admin.id, admin.email)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
