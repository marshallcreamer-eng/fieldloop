'use client'

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import Image from 'next/image'
import type { Product, Reaction } from '@/lib/types'

interface Props {
  product: Product
  onSwipe: (reaction: Reaction) => void
}

const THRESHOLD = 80

export default function SwipeCard({ product, onSwipe }: Props) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate  = useTransform(x, [-220, 220], [-14, 14])
  const opacity = useTransform(x, [-220, -110, 0, 110, 220], [0, 1, 1, 1, 0])

  const loveOpacity    = useTransform(x, [0, THRESHOLD], [0, 1])
  const dislikeOpacity = useTransform(x, [-THRESHOLD, 0], [1, 0])
  const likeOpacity    = useTransform(y, [-THRESHOLD, 0], [1, 0])
  const mehOpacity     = useTransform(y, [0, THRESHOLD], [0, 1])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset } = info
    if (offset.x > THRESHOLD)  return onSwipe('love')
    if (offset.x < -THRESHOLD) return onSwipe('dislike')
    if (offset.y < -THRESHOLD) return onSwipe('like')
    if (offset.y > THRESHOLD)  return onSwipe('meh')
  }

  return (
    <div className="relative w-full max-w-sm mx-auto select-none" style={{ height: 420 }}>

      {/* Shadow card behind for depth */}
      <div className="absolute inset-0 bg-ryobi-dark translate-y-2 translate-x-1 opacity-50" />

      <motion.div
        style={{ x, y, rotate, opacity }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.75}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        whileTap={{ scale: 1.02 }}
      >
        <div className="w-full h-full overflow-hidden shadow-2xl relative">

          {/* Full-bleed image */}
          <div className="absolute inset-0">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full bg-ryobi-dark flex items-center justify-center text-7xl">🔧</div>
            )}
          </div>

          {/* Gradient overlay — image fades to black at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Reaction overlays */}
          <motion.div style={{ opacity: loveOpacity }}
            className="absolute inset-0 bg-ryobi-yellow/20 flex items-center justify-center border-4 border-ryobi-yellow">
            <span className="ryobi-heading text-ryobi-yellow text-5xl font-black rotate-12 drop-shadow-xl tracking-widest">LOVE IT</span>
          </motion.div>
          <motion.div style={{ opacity: dislikeOpacity }}
            className="absolute inset-0 bg-red-500/20 flex items-center justify-center border-4 border-red-500">
            <span className="ryobi-heading text-red-400 text-5xl font-black -rotate-12 drop-shadow-xl tracking-widest">PASS</span>
          </motion.div>
          <motion.div style={{ opacity: likeOpacity }}
            className="absolute inset-0 bg-blue-500/15 flex items-center justify-center border-4 border-blue-400">
            <span className="ryobi-heading text-blue-300 text-5xl font-black drop-shadow-xl tracking-widest">GOOD</span>
          </motion.div>
          <motion.div style={{ opacity: mehOpacity }}
            className="absolute inset-0 bg-white/10 flex items-center justify-center border-4 border-white/40">
            <span className="ryobi-heading text-white text-5xl font-black drop-shadow-xl tracking-widest">OK</span>
          </motion.div>

          {/* ONE+ badge */}
          <div className="absolute top-4 right-4 bg-ryobi-yellow px-2 py-0.5 z-10">
            <span className="ryobi-heading text-ryobi-black text-xs font-black tracking-widest">ONE+™</span>
          </div>

          {/* Product info overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <div className="text-ryobi-yellow text-xs font-bold uppercase tracking-widest mb-1">{product.category}</div>
            <h2 className="ryobi-heading text-xl text-white leading-tight">{product.name}</h2>
            <p className="text-white/50 text-xs mt-1.5 line-clamp-2 leading-relaxed">{product.description}</p>
            <div className="text-white/25 text-xs mt-2 font-mono">SKU: {product.sku}</div>
          </div>

        </div>
      </motion.div>

      {/* Direction hints below card */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-white/25 px-2 uppercase tracking-widest font-semibold">
        <span>← Pass</span>
        <span>↑ Good</span>
        <span>Love →</span>
      </div>
    </div>
  )
}
