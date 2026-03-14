import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user to determine redirect based on admin status
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && user.email) {
        // Check if user is admin by email in admins table
        const { data: adminRecord } = await supabase
          .from('admins')
          .select('id')
          .eq('email', user.email.toLowerCase())
          .single()

        if (adminRecord) {
          return NextResponse.redirect(`${origin}/admin`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/error?error=Could not authenticate user`)
}
