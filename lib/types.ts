export type UserRole = 'client' | 'admin'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  phone: string | null
  address: string | null
  role: UserRole
  points_balance: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  sku: string | null
  product_line: string | null
  description: string | null
  price: number
  category: string | null
  image_url: string | null
  size_ml: number | null
  active: boolean
  created_at: string
}

export interface Purchase {
  id: string
  client_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  points_earned: number
  notes: string | null
  created_at: string
  // Joined data
  product?: Product
  client?: Profile
  payments?: Payment[]
}

export interface Payment {
  id: string
  purchase_id: string
  amount: number
  payment_method: 'cash' | 'transfer' | 'card' | 'other'
  notes: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string | null
  title: string
  message: string
  type: 'info' | 'promo' | 'payment' | 'points'
  read: boolean
  created_at: string
}

export interface PointsLedger {
  id: string
  user_id: string
  change: number
  reason: string
  purchase_id: string | null
  created_at: string
}

// Computed types
export type PaymentStatus = 'paid' | 'partial' | 'pending'

export interface PurchaseWithStatus extends Purchase {
  payment_status: PaymentStatus
  amount_paid: number
  amount_due: number
}

// Form types
export interface SignUpFormData {
  email: string
  password: string
  full_name: string
  phone?: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface ProductFormData {
  name: string
  sku?: string
  description?: string
  price: number
  category?: string
}

export interface PurchaseFormData {
  client_id: string
  product_id: string
  quantity: number
  unit_price: number
  notes?: string
}

export interface PaymentFormData {
  purchase_id: string
  amount: number
  payment_method: 'cash' | 'transfer' | 'card' | 'other'
  notes?: string
}

export interface NotificationFormData {
  user_id?: string | null
  title: string
  message: string
  type: 'info' | 'promo' | 'payment' | 'points'
}

// Dashboard statistics
export interface ClientStats {
  total_purchases: number
  total_spent: number
  total_paid: number
  total_due: number
  points_balance: number
  recent_purchases: PurchaseWithStatus[]
}

export interface AdminStats {
  total_clients: number
  total_products: number
  total_sales: number
  total_revenue: number
  total_collected: number
  total_outstanding: number
  recent_purchases: PurchaseWithStatus[]
}
