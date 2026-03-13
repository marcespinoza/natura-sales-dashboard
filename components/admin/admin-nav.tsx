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
    <aside className="hidden lg:flex w-64 flex-col border-r bg-card min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/admin' && pathname.startsWith('/admin/clients')) ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
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
