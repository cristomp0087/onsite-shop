# OnSite Shop - Architecture Documentation

> E-commerce platform for construction workers in Canada. Next.js 14 + Supabase + Stripe + Zustand.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Payments | Stripe Checkout + Webhooks |
| State | Zustand (persisted to localStorage) |
| Styling | Tailwind CSS + Custom CSS |
| Font | JetBrains Mono |
| Deploy | Vercel |

---

## Project Structure

```
onsite-shop/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with metadata
│   ├── page.tsx                  # Main shop page (floating products)
│   ├── globals.css               # Global styles + motion system
│   ├── admin/
│   │   └── page.tsx              # Admin dashboard (CRUD products)
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts          # Stripe Checkout session creation
│   │   └── webhook/
│   │       └── route.ts          # Stripe webhook handler
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── cart/
│   │   └── page.tsx              # Shopping cart page
│   ├── checkout/
│   │   └── success/
│   │       └── page.tsx          # Post-payment success page
│   └── login/
│       └── page.tsx              # Login/Register page
├── lib/
│   ├── store/
│   │   └── cart.ts               # Zustand cart store
│   └── supabase/
│       ├── client.ts             # Browser Supabase client
│       └── server.ts             # Server Supabase client
├── public/
│   ├── assets/                   # Logo and static assets
│   └── products/                 # Product images (fallback)
└── .env.local                    # Environment variables
```

---

## Core Components

### 1. Main Shop Page (`app/page.tsx`)

The main landing page with an experimental floating products UI.

**Key Features:**
- Infinite vertical scroll with products floating in 3 columns (left, center, right)
- Collision detection prevents product overlap
- Products load from Supabase (falls back to mock data)
- Category filtering (MENS, WOMENS, MEMBERS)
- Product modal with image carousel

**Motion System (Premium UI/UX):**
- `useAmbientParticles(count)` - Floating dust motes in background
- `useInertialValue(target, smoothing)` - 80-150ms lag for smooth feel
- `CustomCursor` - Desktop-only cursor with "VIEW" label on hover
- `BackgroundSystem` - Blueprint grid + dot overlay + particles with parallax
- `ProgressIndicator` - Side scroll progress bar
- `FloatingProductCard` - Hover preview, micro-compression on click

**Animation Loop:**
```typescript
// Continuous animation, never stops
useEffect(() => {
  const animate = () => {
    setFloatingProducts(prev => {
      // Combine auto-scroll speed with user scroll delta
      let newY = product.y - product.speed + scrollDeltaRef.current;
      // Loop products when off-screen
      if (newY < -25) { /* reset to bottom */ }
      if (newY > 120) { /* reset to top */ }
    });
    animationRef.current = requestAnimationFrame(animate);
  };
}, []);
```

### 2. Cart Store (`lib/store/cart.ts`)

Zustand store with localStorage persistence.

**State:**
```typescript
interface CartState {
  items: CartItem[];
  subtotal: number;
  shipping: number;  // $0 if subtotal >= $50, else $9.99
  total: number;
}
```

**Actions:**
- `addItem(item)` - Add or increment item quantity
- `removeItem(variant_id)` - Remove item by variant
- `updateQuantity(variant_id, qty)` - Update quantity (removes if 0)
- `clearCart()` - Empty the cart
- `getCartForCheckout()` - Get cart data for API

**Persistence:**
```typescript
persist(
  (set, get) => ({ /* store */ }),
  {
    name: 'onsite-cart',
    storage: createJSONStorage(() => localStorage),
  }
)
```

### 3. Checkout API (`app/api/checkout/route.ts`)

Creates Stripe Checkout sessions.

**Flow:**
1. Validate cart items
2. Get user from Supabase (if logged in)
3. Create order in `orders` table (pending status)
4. Build Stripe line items (products + shipping)
5. Create Checkout Session with metadata
6. Return session URL

**Metadata passed to Stripe:**
```typescript
metadata: {
  order_id: string,
  order_number: string,
  type: 'shop_order',
  items: JSON.stringify([{ product_id, variant_id, name, quantity, price }])
}
```

### 4. Webhook Handler (`app/api/webhook/route.ts`)

Processes Stripe webhook events.

**`checkout.session.completed` Handler:**
1. Verify webhook signature
2. Check `metadata.type === 'shop_order'`
3. Extract shipping address from session
4. Update order status to `paid`
5. Create `order_items` records
6. Log success

**Shipping Address Extraction:**
```typescript
// Handle both new and legacy Stripe API
const shippingDetails = (session as any).collected_information?.shipping_details
  || (session as any).shipping_details;
```

### 5. Admin Dashboard (`app/admin/page.tsx`)

Product management interface.

**Features:**
- Login required (checks `shop_admins` table)
- CRUD operations for products
- Draft/Publish workflow (`is_published` flag)
- Image URL management
- Size and color variants

**Product Fields:**
```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  images: string[];
  sizes: string[];
  colors: string[];
  is_active: boolean;
  is_featured: boolean;
  is_published: boolean;
  category_id: string;
}
```

### 6. Authentication

**Login Page (`app/login/page.tsx`):**
- Email/Password login and registration
- Google OAuth integration
- Return URL handling after login

**OAuth Callback (`app/auth/callback/route.ts`):**
- Exchanges OAuth code for session
- Redirects to return URL or home

**Supabase Clients:**
- `lib/supabase/client.ts` - Browser client (singleton)
- `lib/supabase/server.ts` - Server client (with cookies)

---

## Database Schema (Supabase)

### Tables

**`products`**
```sql
id            UUID PRIMARY KEY
name          TEXT NOT NULL
slug          TEXT UNIQUE
description   TEXT
base_price    DECIMAL NOT NULL
images        JSONB (array of URLs)
sizes         JSONB (array of strings)
colors        JSONB (array of strings)
is_active     BOOLEAN DEFAULT true
is_featured   BOOLEAN DEFAULT false
is_published  BOOLEAN DEFAULT false
category_id   UUID REFERENCES categories(id)
sort_order    INTEGER
created_at    TIMESTAMPTZ
```

**`categories`**
```sql
id    UUID PRIMARY KEY
name  TEXT NOT NULL
slug  TEXT UNIQUE (mens, womens, members)
```

**`orders`**
```sql
id                      UUID PRIMARY KEY
user_id                 UUID REFERENCES auth.users(id)
order_number            TEXT UNIQUE
status                  TEXT (pending, paid, shipped, delivered)
subtotal                DECIMAL
shipping                DECIMAL
tax                     DECIMAL
total                   DECIMAL
shipping_address        JSONB
stripe_payment_intent_id TEXT
paid_at                 TIMESTAMPTZ
created_at              TIMESTAMPTZ
```

**`order_items`**
```sql
id            UUID PRIMARY KEY
order_id      UUID REFERENCES orders(id)
product_id    UUID REFERENCES products(id)
variant_id    TEXT
product_name  TEXT
quantity      INTEGER
unit_price    DECIMAL
total_price   DECIMAL
```

**`shop_admins`**
```sql
id      UUID PRIMARY KEY
email   TEXT UNIQUE
role    TEXT DEFAULT 'admin'
```

**`temp_carts`** (for Auth Hub integration)
```sql
id          UUID PRIMARY KEY
user_id     UUID
items       JSONB
subtotal    DECIMAL
shipping    DECIMAL
total       DECIMAL
created_at  TIMESTAMPTZ
expires_at  TIMESTAMPTZ (24h TTL)
```

---

## Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      CHECKOUT FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User clicks "Finalizar Compra" in /cart                 │
│     ↓                                                       │
│  2. POST /api/checkout                                      │
│     - Validates cart                                        │
│     - Creates order in Supabase (status: pending)           │
│     - Creates Stripe Checkout Session                       │
│     ↓                                                       │
│  3. Redirect to Stripe Checkout                             │
│     - User enters payment + shipping                        │
│     ↓                                                       │
│  4. Payment Success → Redirect to /checkout/success         │
│     - Cart cleared                                          │
│     - Shows confirmation                                    │
│     ↓                                                       │
│  5. Stripe Webhook (checkout.session.completed)             │
│     - Updates order status to "paid"                        │
│     - Creates order_items records                           │
│     - Stores shipping address                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...  # For webhook

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# URLs
NEXT_PUBLIC_SHOP_URL=https://shop.onsiteclub.ca
NEXT_PUBLIC_AUTH_URL=https://auth.onsiteclub.ca  # Optional
```

---

## CSS Architecture (`app/globals.css`)

### Design Tokens
```css
:root {
  --onsite-primary: #1B2B27;
  --onsite-light: #FBFAFC;
  --onsite-amber: #F6C343;
  --grain-light: #D8D4C8;
  --grain-mid: #C9C4B5;
  --grain-dark: #B8B3A4;
}
```

### Component Classes
- `.btn-primary` - Dark button with white text
- `.btn-accent` - Amber button (CTA)
- `.btn-secondary` - White button with border
- `.input` - Form input styling
- `.card` - White card with blur
- `.bg-grain` - Grainy 3D background with noise overlay

### Motion System
- `.micro-press:active` - 0.98 scale on click
- `.ambient-particle` - 20s drift animation
- `.animate-subtle-fade-in` - 150ms fade+slide

### Accessibility
```css
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}

@media (hover: none) and (pointer: coarse) {
  /* Mobile touch fallbacks */
}
```

---

## Key Functions Reference

### `app/page.tsx`

| Function | Purpose |
|----------|---------|
| `useAmbientParticles(count)` | Creates floating dust particles |
| `useInertialValue(target, smoothing)` | Smooth value interpolation |
| `checkOverlap(a, b)` | Collision detection for products |
| `findValidPosition(zone, products, yStart)` | Find non-overlapping position |
| `loadProductsFromSupabase()` | Fetch products from DB |
| `initializeProducts()` | Initialize floating product positions |
| `handleProductClick(product)` | Open modal with focus ritual |

### `lib/store/cart.ts`

| Function | Purpose |
|----------|---------|
| `addItem(item)` | Add item to cart |
| `removeItem(variant_id)` | Remove item from cart |
| `updateQuantity(variant_id, qty)` | Update item quantity |
| `clearCart()` | Empty the cart |
| `calculateTotals(items)` | Recalculate subtotal/shipping/total |
| `saveCartAndGetCheckoutUrl()` | Save cart to temp_carts (Auth Hub) |

### `app/api/checkout/route.ts`

| Function | Purpose |
|----------|---------|
| `POST(request)` | Create Stripe Checkout session |

### `app/api/webhook/route.ts`

| Function | Purpose |
|----------|---------|
| `POST(request)` | Handle Stripe webhook events |

---

## Deployment

### Vercel Configuration

The app is deployed on Vercel with automatic deployments from the `main` branch.

**Build Command:** `next build`
**Output Directory:** `.next`

### Stripe Webhook Setup

1. Create webhook endpoint in Stripe Dashboard
2. URL: `https://shop.onsiteclub.ca/api/webhook`
3. Events: `checkout.session.completed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Future Integrations

### Auth Hub Integration

The shop is designed to integrate with a central Auth Hub for unified authentication across OnSite services.

**Flow:**
1. Shop saves cart to `temp_carts` table
2. Redirect to Auth Hub with `cart_id`
3. Auth Hub handles address verification
4. Auth Hub creates Stripe session
5. Webhook updates order in shop database

### Planned Features

- [ ] Order history page
- [ ] Email notifications
- [ ] Inventory tracking
- [ ] Discount codes
- [ ] Multiple currencies (USD)
