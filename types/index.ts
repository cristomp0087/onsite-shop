export interface Product {
  id: string
  name: string
  slug: string
  price: number
  category: 'mens' | 'womens' | 'members'
  image: string
  images: string[]
  description: string
  sizes: string[]
  colors: string[]
  isVideo?: boolean
  active: boolean
  created_at: string
}

export interface CartItem {
  product_id: string
  variant_id: string
  name: string
  color: string
  size: string
  price: number
  quantity: number
  image: string
}

export interface TempCart {
  id: string
  items: CartItem[]
  created_at: string
  expires_at: string
}

export interface Order {
  id: string
  user_id: string
  items: CartItem[]
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  shipping_address: ShippingAddress
  created_at: string
  updated_at: string
}

export interface ShippingAddress {
  name: string
  street: string
  city: string
  province: string
  postal_code: string
  country: string
}
