'use client'

import Image from 'next/image'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
}

export default function SwipeCard({ product }: Props) {
  return (
    <div className="relative w-full max-w-sm mx-auto select-none" style={{ height: 380 }}>

      {/* Shadow card for depth */}
      <div className="absolute inset-0 bg-ryobi-dark translate-y-2 translate-x-1 opacity-50" />

      <div className="absolute inset-0 overflow-hidden shadow-2xl">

        {/* Full-bleed image */}
        <div className="absolute inset-0">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full bg-ryobi-dark flex items-center justify-center text-7xl">🔧</div>
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* ONE+ badge */}
        <div className="absolute top-4 right-4 bg-ryobi-yellow px-2 py-0.5 z-10">
          <span className="ryobi-heading text-ryobi-black text-xs font-black tracking-widest">ONE+™</span>
        </div>

        {/* Product info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <div className="text-ryobi-yellow text-xs font-bold uppercase tracking-widest mb-1">{product.category}</div>
          <h2 className="ryobi-heading text-xl text-white leading-tight">{product.name}</h2>
          <p className="text-white/60 text-sm mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
          <div className="text-white/30 text-xs mt-2 font-mono">SKU: {product.sku}</div>
        </div>

      </div>
    </div>
  )
}
