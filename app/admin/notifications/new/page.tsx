'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bell, ArrowLeft, Globe, User, Info, Tag, CreditCard, Award } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { Profile } from '@/lib/types'

export default function NewNotificationPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [recipientType, setRecipientType] = useState<'all' | 'individual'>('all')
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'info' | 'promo' | 'payment' | 'points'>('info')
  const [isSending, setIsSending] = useState(false)

  // Fetch clients
  const { data: clients } = useSWR<Profile[]>('notification-clients', async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('full_name')
    return data || []
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title || !message) {
      toast.error('Please fill in title and message')
      return
    }

    if (recipientType === 'individual' && !userId) {
      toast.error('Please select a recipient')
      return
    }

    setIsSending(true)

    const notificationData = {
      user_id: recipientType === 'all' ? null : userId,
      title,
      message,
      type: notificationType,
      read: false,
    }

    const { error } = await supabase
      .from('notifications')
      .insert(notificationData)

    if (error) {
      toast.error('Failed to send notification')
      setIsSending(false)
      return
    }

    toast.success(
      recipientType === 'all'
        ? 'Notification sent to all clients'
        : 'Notification sent successfully'
    )
    router.push('/admin/notifications')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/notifications">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Notification</h1>
          <p className="text-muted-foreground">
            Send a notification to your clients
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Details
              </CardTitle>
              <CardDescription>
                Compose your notification message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recipient Type */}
              <div className="space-y-3">
                <Label>Send To</Label>
                <RadioGroup
                  value={recipientType}
                  onValueChange={(value) => setRecipientType(value as 'all' | 'individual')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                      <Globe className="h-4 w-4" />
                      All Clients
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="individual" id="individual" />
                    <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Specific Client
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Client Selection (if individual) */}
              {recipientType === 'individual' && (
                <div className="space-y-2">
                  <Label>Select Client *</Label>
                  <Select value={userId} onValueChange={setUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name || 'No name'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notification Type */}
              <div className="space-y-2">
                <Label>Notification Type</Label>
                <Select
                  value={notificationType}
                  onValueChange={(value) => setNotificationType(value as typeof notificationType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        General Info
                      </div>
                    </SelectItem>
                    <SelectItem value="promo">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Promotion
                      </div>
                    </SelectItem>
                    <SelectItem value="payment">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment
                      </div>
                    </SelectItem>
                    <SelectItem value="points">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Points
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., New Products Available!"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your notification message..."
                  rows={5}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {"How clients will see your notification"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    notificationType === 'promo' ? 'bg-primary/10 text-primary' :
                    notificationType === 'payment' ? 'bg-chart-2/20 text-chart-2' :
                    notificationType === 'points' ? 'bg-chart-3/20 text-chart-3' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {notificationType === 'info' && <Info className="h-5 w-5" />}
                    {notificationType === 'promo' && <Tag className="h-5 w-5" />}
                    {notificationType === 'payment' && <CreditCard className="h-5 w-5" />}
                    {notificationType === 'points' && <Award className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">
                      {title || 'Notification Title'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {message || 'Your notification message will appear here...'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Just now
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Recipients</h4>
                <p className="text-sm text-muted-foreground">
                  {recipientType === 'all' ? (
                    <>
                      <Globe className="inline h-4 w-4 mr-1" />
                      All {clients?.length || 0} clients will receive this notification
                    </>
                  ) : userId ? (
                    <>
                      <User className="inline h-4 w-4 mr-1" />
                      {clients?.find((c) => c.id === userId)?.full_name || 'Selected client'}
                    </>
                  ) : (
                    'Select a client to preview'
                  )}
                </p>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isSending || !title || !message || (recipientType === 'individual' && !userId)}
              >
                {isSending ? <Spinner className="mr-2" /> : <Bell className="mr-2 h-4 w-4" />}
                Send Notification
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
