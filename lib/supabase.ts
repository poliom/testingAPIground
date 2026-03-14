import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const db = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'api_ground' },
  auth: { persistSession: false }
})

// Typed table helpers
export type Profile = {
  id: string
  email: string
  password_hash: string
  full_name: string | null
  role: 'ADMIN' | 'USER' | 'GUEST'
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category: string
  stock: number
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  user_id: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  created_at: string
}

export type RefreshToken = {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
}

export const profiles = () => db.from('profiles')
export const products = () => db.from('products')
export const orders = () => db.from('orders')
export const orderItems = () => db.from('order_items')
export const refreshTokens = () => db.from('refresh_tokens')
