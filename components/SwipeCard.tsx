'use client'

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import Image from 'next/image'
import type { Product, Reaction } from '@/lib/types'

interface Props {
  product: Product
  onSwipe: (reaction: Reaction) => void
}

const SWIPE_THRESHOLD = 80

export default function SwipeCard({ product, onSwipe }: Props) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-12, 12])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const loveOpacity    = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const dislikeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  const likeOpacity    = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0])
  const mehOpacity     = useTransform(y, [0, SWIPE_THRESHOLD], [0, 1])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset } = info
    if (offset.x > SWIPE_THRESHOLD)  return onSwipe('love')
    if (offset.x < -SWIPE_THRESHOLD) return onSwipe('dislike')
    if (offset.y < -SWIPE_THRESHOLD) return onSwipe('like')
    if (offset.y > SWIPE_THRESHOLD)  return onSwipe('meh')
  }

  return (
    <div className="relative w-full max-w-sm mx-auto select-none">
      <motion.div
        style={{ x, y, rotate, opacity }}
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        className="cursor-grab active:cursor-grabbing"
        whileTap={{ scale: 1.02 }}
      >
        <div className="bg-ryobi-dark overflow-hidden shadow-2xl border-b-4 border-ryobi-yellow">
          {/* Product image */}
          <div className="relative h-72 bg-black">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover opacity-80" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-ryobi-yellow text-6xl">🔧</div>
            )}

            {/* Reaction overlays */}
            <motion.div style={{ opacity: loveOpacity }}
              className="absolute inset-0 bg-ryobi-yellow/30 flex items-center justify-center">
              <span className="text-ryobi-yellow text-5xl font-black ryobi-heading rotate-12 drop-shadow-lg">LOVE IT</span>
            </motion.div>
            <motion.div style={{ opacity: dislikeOpacity }}
              className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
              <span className="text-red-400 text-5xl font-black ryobi-heading -rotate-12 drop-shadow-lg">NOPE</span>
            </motion.div>
            <motion.div style={{ opacity: likeOpacity }}
              className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-300 text-5xl font-black ryobi-heading drop-shadow-lg">GOOD</span>
            </motion.div>
            <motion.div style={{ opacity: mehOpacity }}
              className="absolute inset-0 bg-white/10 flex items-center justify-center">
              <span className="text-white text-5xl font-black ryobi-heading drop-shadow-lg">MEH</span>
            </motion.div>

            {/* ONE+ badge */}
            <div className="absolute top-3 right-3 bg-ryobi-yellow px-2 py-0.5">
              <span className="text-ryobi-black text-xs font-black ryobi-heading">ONE+™</span>
            </div>
          </div>

          <div className="p-4 bg-ryobi-dark">
            <div className="text-ryobi-yellow text-xs font-bold uppercase tracking-widest mb-1">{product.category}</div>
            <h2 className="ryobi-heading text-xl text-white">{product.name}</h2>
            <p className="text-ryobi-gray text-xs mt-1 line-clamp-2">{product.description}</p>
            <div className="mt-2 text-xs text-ryobi-muted">SKU: {product.sku}</div>
          </div>
        </div>
      </motion.div>

      <div className="absolute -bottom-7 left-0 right-0 flex justify-between text-xs text-ryobi-gray px-2 uppercase tracking-wider font-semibold">
        <span>← Nope</span>
        <span>↑ Good</span>
        <span>Love it →</span>
      </div>
    </div>
  )
}
