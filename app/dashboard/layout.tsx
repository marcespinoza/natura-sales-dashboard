import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Redirect admins to admin dashboard
  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  // Get unread notifications count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .or(`recipient_id.eq.${user.id},is_global.eq.true`)
    .eq('is_read', false)

  // Get catalog URL from settings
  const { data: settings } = await supabase
    .from('settings')
    .select('catalog_url')
    .single()

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        user={user} 
        profile={profile} 
        unreadCount={unreadCount || 0}
        catalogUrl={settings?.catalog_url || null}
      />
      <div className="flex">
        <DashboardNav />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
