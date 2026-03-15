'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Users, 
  Package, 
  Bell,
  Settings 
} from 'lucide-react'

const navItems = [
  {
    title: 'Clientes',
    href: '/admin',
    icon: Users,
  },
  {
    title: 'Productos',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Notificaciones',
    href: '/admin/notifications',
    icon: Bell,
  },
  {
    title: 'Configuracion',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-64 lg:flex flex-col border-b lg:border-b-0 lg:border-r bg-card">
      <nav className="flex flex-row lg:flex-col gap-1 p-2 lg:p-4 overflow-x-auto lg:overflow-x-visible min-h-fit lg:min-h-[calc(100vh-4rem)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/admin' && pathname.startsWith('/admin/clients')) ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 lg:gap-3 rounded-lg px-2 lg:px-3 py-2 lg:py-2.5 text-xs lg:text-sm font-medium transition-colors whitespace-nowrap lg:whitespace-normal',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="hidden lg:inline">{item.title}</span>
              <span className="lg:hidden text-[10px]">{item.title.slice(0, 3)}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
