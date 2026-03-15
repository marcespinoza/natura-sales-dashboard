import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCurrency(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount) || 0
  if (isNaN(num)) return '$0.00'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy', { locale: es })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy h:mm a', { locale: es })
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('es-MX').format(num)
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`
  }
  return phone
}
