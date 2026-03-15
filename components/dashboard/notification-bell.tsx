'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'
import { Bell, Info, Tag, CreditCard, Award, Check } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'

interface NotificationBellProps {
  userId: string
  initialUnreadCount: number
}

const iconMap = {
  info: Info,
  promo: Tag,
  payment: CreditCard,
  points: Award,
}

export function NotificationBell({ userId, initialUnreadCount }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const { data: notifications, mutate } = useSWR<Notification[]>(
    `notifications-${userId}`,
    async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .or(`recipient_id.eq.${userId},is_global.eq.true`)
        .order('created_at', { ascending: false })
        .limit(20)
      return data || []
    },
    {
      fallbackData: [],
      revalidateOnFocus: false,
    }
  )

  const unreadCount = notifications?.filter((n) => !n.is_read).length ?? initialUnreadCount

  async function markAsRead(notificationId: string) {
    try {
      console.log('[v0] Marking notification as read:', notificationId)
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
      
      if (error) {
        console.error('[v0] Error marking as read:', error)
        return
      }
      
      console.log('[v0] Notification marked as read successfully')
      await mutate()
    } catch (err) {
      console.error('[v0] Exception:', err)
    }
  }

  async function markAllAsRead() {
    if (!notifications) return
    
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
    
    mutate()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="mr-1 h-3 w-3" />
              Marcar todas leídas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type] || Info
                return (
                  <div
                    key={notification.id}
                    className={`flex gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.is_read ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      notification.type === 'promo' ? 'bg-primary/10 text-primary' :
                      notification.type === 'payment' ? 'bg-chart-2/20 text-chart-2' :
                      notification.type === 'points' ? 'bg-chart-3/20 text-chart-3' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm leading-tight ${!notification.is_read ? 'font-medium' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Sin notificaciones aún</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
