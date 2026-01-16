import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (variant_id: string) => void
  updateQuantity: (variant_id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  saveCartAndGetCheckoutUrl: () => Promise<string>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.variant_id === item.variant_id
          )

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.variant_id === item.variant_id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }

          return { items: [...state.items, item] }
        })
      },

      removeItem: (variant_id) => {
        set((state) => ({
          items: state.items.filter((i) => i.variant_id !== variant_id),
        }))
      },

      updateQuantity: (variant_id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variant_id)
          return
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.variant_id === variant_id ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const { items } = get()
        return items.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      saveCartAndGetCheckoutUrl: async () => {
        const { items } = get()

        // Generate a unique cart ID
        const cart_id = crypto.randomUUID()

        // TODO: Save cart to Supabase temp_carts table
        // const supabase = createClient()
        // await supabase.from('temp_carts').insert({
        //   id: cart_id,
        //   items: items,
        //   created_at: new Date().toISOString(),
        //   expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
        // })

        // Return the Auth Hub checkout URL with cart_id
        const authHubUrl = process.env.NEXT_PUBLIC_AUTH_HUB_URL || 'https://auth.onsiteclub.ca'
        return `${authHubUrl}/checkout?cart_id=${cart_id}&return_url=${encodeURIComponent(window.location.origin)}`
      },
    }),
    {
      name: 'onsite-cart',
    }
  )
)
