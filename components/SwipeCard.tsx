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
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const loveOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1])
  const dislikeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0])
  const likeOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0])
  const mehOpacity = useTransform(y, [0, SWIPE_THRESHOLD], [0, 1])

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset } = info
    if (offset.x > SWIPE_THRESHOLD) return onSwipe('love')
    if (offset.x < -SWIPE_THRESHOLD) return onSwipe('dislike')
    if (offset.y < -SWIPE_THRESHOLD) return onSwipe('like')
    if (offset.y > SWIPE_THRESHOLD) return onSwipe('meh')
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
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="relative h-72 bg-gray-100">
            {product.image_url ? (
              <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">🔧</div>
            )}

            {/* Swipe indicators */}
            <motion.div style={{ opacity: loveOpacity }}
              className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <span className="text-6xl rotate-12">❤️</span>
            </motion.div>
            <motion.div style={{ opacity: dislikeOpacity }}
              className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
              <span className="text-6xl -rotate-12">👎</span>
            </motion.div>
            <motion.div style={{ opacity: likeOpacity }}
              className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
              <span className="text-6xl">👍</span>
            </motion.div>
            <motion.div style={{ opacity: mehOpacity }}
              className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
              <span className="text-6xl">😐</span>
            </motion.div>
          </div>

          <div className="p-5">
            <div className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">{product.category}</div>
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
            <div className="mt-3 text-xs text-gray-400">SKU: {product.sku}</div>
          </div>
        </div>
      </motion.div>

      {/* Swipe hint labels */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-between text-xs text-gray-400 px-4">
        <span>← Dislike</span>
        <span>↑ Like</span>
        <span>Love →</span>
      </div>
    </div>
  )
}
