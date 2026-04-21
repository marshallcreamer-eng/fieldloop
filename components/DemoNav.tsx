'use client'

import { usePathname } from 'next/navigation'

interface Props {
  productName?: string
}

const LINKS = [
  { label: 'Home',      href: '/' },
  { label: 'Products',  href: '/tester' },
  { label: 'Dashboard', href: '/dashboard' },
]

export default function DemoNav({ productName }: Props) {
  const path = usePathname()

  return (
    <div className="bg-black border-b border-white/10 px-4 py-2 flex items-center gap-1 overflow-x-auto">
      {LINKS.map((link, i) => {
        const isActive = link.href === '/'
          ? path === '/'
          : path.startsWith(link.href)

        return (
          <div key={link.href} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && <span className="text-white/25 text-xs">·</span>}
            <a
              href={link.href}
              className={`text-xs font-semibold uppercase tracking-widest px-2 py-1 transition-colors
                ${isActive
                  ? 'text-ryobi-yellow'
                  : 'text-white/55 hover:text-white'
                }`}
            >
              {link.label}
            </a>
          </div>
        )
      })}

      {productName && (
        <>
          <span className="text-white/25 text-xs flex-shrink-0">·</span>
          <span className="text-white/45 text-xs uppercase tracking-widest truncate max-w-[160px] px-2">
            {productName}
          </span>
        </>
      )}
    </div>
  )
}
