'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        full_name: fullName,
        phone: phone || null,
        role: 'client', // Default role for self-registration
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/auth/sign-up-success')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Get user to determine redirect based on admin status
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Check if user is an admin by email in admins table
    const { data: adminRecord } = await supabase
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .single()

    revalidatePath('/', 'layout')
    
    if (adminRecord) {
      redirect('/admin')
    } else {
      redirect('/dashboard')
    }
  }

  redirect('/dashboard')
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithFacebook() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function isUserAdmin(email?: string | null) {
  if (!email) return false
  
  const supabase = await createClient()
  const { data: adminRecord } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .single()

  return !!adminRecord
}

export async function getAdmins() {
  const supabase = await createClient()
  const { data: admins, error } = await supabase
    .from('admins')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching admins:', error)
    return []
  }

  return admins || []
}

export async function addAdmin(email: string, addedBy: string) {
  const supabase = await createClient()
  
  // Check if already admin
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    return { error: 'Este correo ya es administrador' }
  }

  const { error } = await supabase
    .from('admins')
    .insert({
      email: email.toLowerCase().trim(),
      added_by: addedBy,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

export async function removeAdmin(adminId: string, currentUserEmail: string) {
  const supabase = await createClient()
  
  // Get the admin to be removed
  const { data: adminToRemove } = await supabase
    .from('admins')
    .select('email')
    .eq('id', adminId)
    .single()

  // Prevent removing yourself
  if (adminToRemove?.email === currentUserEmail) {
    return { error: 'No puedes eliminarte a ti mismo como administrador' }
  }

  // Count remaining admins
  const { count } = await supabase
    .from('admins')
    .select('*', { count: 'exact', head: true })

  if (count && count <= 1) {
    return { error: 'Debe haber al menos un administrador' }
  }

  const { error } = await supabase
    .from('admins')
    .delete()
    .eq('id', adminId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}
