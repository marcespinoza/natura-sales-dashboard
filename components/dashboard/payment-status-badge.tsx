import { Badge } from '@/components/ui/badge'
import type { PaymentStatus } from '@/lib/types'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  showIcon?: boolean
}

export function PaymentStatusBadge({ status, showIcon = true }: PaymentStatusBadgeProps) {
  const config = {
    paid: {
      label: 'Pagado',
      icon: CheckCircle,
      className: 'bg-status-paid/10 text-status-paid hover:bg-status-paid/20 border-status-paid/20',
    },
    partial: {
      label: 'Parcial',
      icon: Clock,
      className: 'bg-status-partial/10 text-status-partial hover:bg-status-partial/20 border-status-partial/20',
    },
    pending: {
      label: 'Pendiente',
      icon: AlertCircle,
      className: 'bg-status-pending/10 text-status-pending hover:bg-status-pending/20 border-status-pending/20',
    },
  }

  const { label, icon: Icon, className } = config[status]

  return (
    <Badge variant="outline" className={className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  )
}
