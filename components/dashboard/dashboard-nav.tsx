'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ShoppingBag, CreditCard, Award, FileText, User } from 'lucide-react'

const navItems = [
  {
    title: 'Resumen',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Compras',
    href: '/dashboard/purchases',
    icon: ShoppingBag,
  },
  {
    title: 'Pagos',
    href: '/dashboard/payments',
    icon: CreditCard,
  },
  {
    title: 'Puntos',
    href: '/dashboard/points',
    icon: Award,
  },
  {
    title: 'Estados de Cuenta',
    href: '/dashboard/statements',
    icon: FileText,
  },
  {
    title: 'Perfil',
    href: '/dashboard/profile',
    icon: User,
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
