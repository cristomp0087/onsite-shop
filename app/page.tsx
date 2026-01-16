'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCartStore } from '@/lib/store/cart';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  category: 'mens' | 'womens' | 'members';
  image: string;
  images: string[];
  description: string;
  sizes: string[];
  colors: string[];
  isVideo?: boolean;
}

interface FloatingProduct extends Product {
  x: number;
  y: number;
  zone: 'left' | 'center' | 'right';
  scale: number;
  speed: number;
  id: string;
  uniqueKey: string;
}

// Mock products
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Camiseta OnSite Amber',
    price: 29.99,
    category: 'mens',
    image: '/products/camiseta-amber.webp',
    images: ['/products/camiseta-amber-1.webp', '/products/camiseta-amber-2.webp', '/products/camiseta-amber-3.webp'],
    description: 'Camiseta 100% algodão ringspun, pré-encolhida. Estampa em silk de alta durabilidade. Feita pra aguentar o trabalho pesado.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Amber', 'Black', 'White'],
  },
  {
    id: 'prod-002',
    name: 'Boné OnSite Classic',
    price: 24.99,
    category: 'mens',
    image: '/products/bone-classic.webp',
    images: ['/products/bone-1.webp', '/products/bone-2.webp', '/products/bone-3.webp'],
    description: 'Boné estruturado com aba curva. Ajuste snapback. Logo bordado em alta definição.',
    sizes: ['Único'],
    colors: ['Black', 'Navy', 'Amber'],
  },
  {
    id: 'prod-003',
    name: 'Moletom OnSite Heavy',
    price: 59.99,
    category: 'mens',
    image: '/products/moletom-heavy.webp',
    images: ['/products/moletom-1.webp', '/products/moletom-2.webp', '/products/moletom-3.webp'],
    description: 'Moletom pesado 400g/m². Capuz forrado. Bolso canguru. Punhos e barra em ribana.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Gray', 'Navy'],
  },
  {
    id: 'prod-004',
    name: 'Kit Adesivos OnSite',
    price: 12.99,
    category: 'members',
    image: '/products/adesivos-kit.webp',
    images: ['/products/adesivos-1.webp', '/products/adesivos-2.webp', '/products/adesivos-3.webp'],
    description: 'Kit com 5 adesivos vinil premium. Resistente a água e sol. Perfeito pro capacete ou caixa de ferramentas.',
    sizes: ['Único'],
    colors: ['Mix'],
  },
  {
    id: 'prod-005',
    name: 'Camiseta OnSite Black',
    price: 29.99,
    category: 'womens',
    image: '/products/camiseta-black.webp',
    images: ['/products/camiseta-black-1.webp', '/products/camiseta-black-2.webp', '/products/camiseta-black-3.webp'],
    description: 'Camiseta 100% algodão ringspun. Corte feminino. Estampa em silk de alta durabilidade.',
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: ['Black', 'White', 'Amber'],
  },
  {
    id: 'prod-006',
    name: 'Caneca OnSite Builder',
    price: 19.99,
    category: 'members',
    image: '/products/caneca.webp',
    images: ['/products/caneca-1.webp', '/products/caneca-2.webp', '/products/caneca-3.webp'],
    description: 'Caneca cerâmica 350ml. Impressão de alta qualidade. Vai bem no microondas e lava-louças.',
    sizes: ['Único'],
    colors: ['White', 'Black'],
  },
];

// Product Modal Component
function ProductModal({ 
  product, 
  onClose 
}: { 
  product: Product | null; 
  onClose: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || '');
      setSelectedColor(product.colors[0] || '');
      setSelectedImage(0);
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      variant_id: `${product.id}-${selectedSize}-${selectedColor}`,
      name: product.name,
      color: selectedColor,
      size: selectedSize,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
    onClose();
  };

  const handleCheckout = () => {
    handleAddToCart();
    // TODO: Redirect to checkout
    window.location.href = '/cart';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-[#F5F3EF] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/80 hover:bg-white transition-colors"
        >
          <span className="text-2xl leading-none">&times;</span>
        </button>

        <div className="p-6 md:p-8">
          {/* Image gallery */}
          <div className="mb-6">
            <div className="aspect-square bg-white rounded-xl mb-3 flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                <span className="text-6xl">📦</span>
              </div>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`flex-1 aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === idx ? 'border-[#F6C343]' : 'border-transparent'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-300">
                    <span className="text-2xl">📦</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <h2 className="font-mono text-2xl font-bold text-[#1B2B27] mb-2">
            {product.name}
          </h2>
          <p className="font-mono text-xl text-[#F6C343] font-bold mb-4">
            CA${product.price.toFixed(2)}
          </p>
          <p className="text-[#6B7280] mb-6 leading-relaxed">
            {product.description}
          </p>

          {/* Size selector */}
          {product.sizes.length > 1 && (
            <div className="mb-4">
              <p className="font-mono text-sm text-[#1B2B27] mb-2 uppercase tracking-wider">
                Tamanho
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                      selectedSize === size
                        ? 'bg-[#1B2B27] text-white'
                        : 'bg-white text-[#1B2B27] hover:bg-gray-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color selector */}
          {product.colors.length > 1 && (
            <div className="mb-6">
              <p className="font-mono text-sm text-[#1B2B27] mb-2 uppercase tracking-wider">
                Cor
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                      selectedColor === color
                        ? 'bg-[#1B2B27] text-white'
                        : 'bg-white text-[#1B2B27] hover:bg-gray-100'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-[#1B2B27] text-white font-mono py-4 px-6 rounded-xl hover:bg-[#2a3d38] transition-colors uppercase tracking-wider text-sm"
            >
              Add to Bag
            </button>
            <button
              onClick={handleCheckout}
              className="flex-1 bg-[#F6C343] text-[#1B2B27] font-mono py-4 px-6 rounded-xl hover:bg-[#e5b43d] transition-colors uppercase tracking-wider text-sm font-bold"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating Product Card
function FloatingProductCard({ 
  product, 
  onClick 
}: { 
  product: FloatingProduct;
  onClick: () => void;
}) {
  const isCenter = product.zone === 'center';
  
  return (
    <div
      className="absolute cursor-pointer transition-transform duration-300 hover:scale-105"
      style={{
        left: `${product.x}%`,
        top: `${product.y}%`,
        transform: `translate(-50%, -50%) scale(${product.scale})`,
        zIndex: isCenter ? 20 : 10,
      }}
      onClick={onClick}
    >
      <div className={`
        bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg
        ${isCenter ? 'w-48 md:w-56' : 'w-36 md:w-44'}
      `}>
        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
          <span className={`${isCenter ? 'text-6xl' : 'text-4xl'}`}>📦</span>
        </div>
        <div className="p-3">
          <p className="font-mono text-xs text-[#1B2B27] truncate">{product.name}</p>
          <p className="font-mono text-sm font-bold text-[#F6C343]">
            CA${product.price.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState<'mens' | 'womens' | 'members'>('mens');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [floatingProducts, setFloatingProducts] = useState<FloatingProduct[]>([]);
  const animationRef = useRef<number | null>(null);
  const scrollSpeed = useRef(1);
  const lastScrollTime = useRef(Date.now());
  const cartItems = useCartStore((state) => state.items);

  // Initialize floating products
  const initializeProducts = useCallback(() => {
    const categoryProducts = MOCK_PRODUCTS.filter(p => p.category === activeCategory);
    const products: FloatingProduct[] = [];
    
    // Create multiple instances for each zone
    const zones: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
    
    zones.forEach((zone) => {
      // Add 3-4 products per zone
      const count = zone === 'center' ? 3 : 4;
      for (let i = 0; i < count; i++) {
        const product = categoryProducts[Math.floor(Math.random() * categoryProducts.length)];
        const xRange = zone === 'left' ? [5, 30] : zone === 'center' ? [35, 65] : [70, 95];
        
        products.push({
          ...product,
          uniqueKey: `${zone}-${i}-${Date.now()}`,
          x: xRange[0] + Math.random() * (xRange[1] - xRange[0]),
          y: Math.random() * 120 - 10, // -10% to 110% for smooth entry/exit
          zone,
          scale: zone === 'center' ? 1.1 : 0.9,
          speed: zone === 'center' ? 0.015 : 0.025, // Center slower
        });
      }
    });
    
    setFloatingProducts(products);
  }, [activeCategory]);

  useEffect(() => {
    initializeProducts();
  }, [initializeProducts]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setFloatingProducts(prev => 
        prev.map(product => {
          let newY = product.y - product.speed * scrollSpeed.current;
          
          // Loop: when product goes off top, reset to bottom
          if (newY < -15) {
            const xRange = product.zone === 'left' ? [5, 30] : product.zone === 'center' ? [35, 65] : [70, 95];
            return {
              ...product,
              y: 115,
              x: xRange[0] + Math.random() * (xRange[1] - xRange[0]),
            };
          }
          
          return { ...product, y: newY };
        })
      );
      
      // Gradually return to normal speed
      if (scrollSpeed.current > 1) {
        scrollSpeed.current = Math.max(1, scrollSpeed.current - 0.02);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle scroll to speed up animation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime.current > 16) { // ~60fps throttle
        scrollSpeed.current = Math.min(8, scrollSpeed.current + Math.abs(e.deltaY) * 0.01);
        lastScrollTime.current = now;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const categories: Array<{ key: 'mens' | 'womens' | 'members'; label: string }> = [
    { key: 'mens', label: 'MENS' },
    { key: 'womens', label: 'WOMENS' },
    { key: 'members', label: 'MEMBERS' },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Grainy 3D Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #D4CFC4 0%, #C9C4B8 50%, #BEB9AD 100%)',
        }}
      >
        {/* Noise overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)"/>
        </svg>
        
        {/* 3D depth gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 0%, rgba(0,0,0,0.08) 100%)',
          }}
        />
      </div>

      {/* Floating Menu */}
      <nav className="absolute top-0 left-0 right-0 z-40 px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="https://onsiteclub.ca" className="font-mono text-lg font-bold text-[#1B2B27] tracking-tight">
            ONSITE SHOP
          </a>

          {/* Categories */}
          <div className="flex items-center gap-6">
            {categories.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`font-mono text-sm tracking-wider transition-all ${
                  activeCategory === key
                    ? 'text-[#1B2B27] font-bold'
                    : 'text-[#1B2B27]/60 hover:text-[#1B2B27]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right menu */}
          <div className="flex items-center gap-6">
            <a 
              href="/cart" 
              className="font-mono text-sm text-[#1B2B27] tracking-wider hover:text-[#1B2B27]/70 transition-colors"
            >
              CART{cartItems.length > 0 && `(${cartItems.length})`}
            </a>
            <a 
              href="https://auth.onsiteclub.ca/login" 
              className="font-mono text-sm text-[#1B2B27] tracking-wider hover:text-[#1B2B27]/70 transition-colors"
            >
              LOGIN
            </a>
            <a 
              href="https://onsiteclub.ca" 
              className="font-mono text-sm text-[#1B2B27]/60 tracking-wider hover:text-[#1B2B27] transition-colors"
            >
              ← SITE
            </a>
          </div>
        </div>
      </nav>

      {/* Floating Products */}
      <div className="absolute inset-0">
        {floatingProducts.map((product) => (
          <FloatingProductCard
            key={product.uniqueKey}
            product={product}
            onClick={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
        />
      )}

      {/* Bottom tagline */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
        <p className="font-mono text-xs text-[#1B2B27]/50 tracking-[0.3em] uppercase">
          Wear What You Do
        </p>
      </div>
    </div>
  );
}
