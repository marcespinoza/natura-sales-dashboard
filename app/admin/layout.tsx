import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/admin-nav'
import { AdminHeader } from '@/components/admin/admin-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin by email in admins table (case-insensitive)
  const { data: adminRecord } = await supabase
    .from('admins')
    .select('id')
    .ilike('email', user.email?.toLowerCase() || '')
    .single()

  // Redirect non-admins to client dashboard
  if (!adminRecord) {
    redirect('/dashboard')
  }

  // Get user profile for display
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader user={user} profile={profile} />
      <div className="flex">
        <AdminNav />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
