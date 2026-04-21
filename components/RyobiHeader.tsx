interface Props {
  subtitle?: string
  right?: React.ReactNode
}

export default function RyobiHeader({ subtitle, right }: Props) {
  return (
    <div className="bg-ryobi-black border-b-4 border-ryobi-yellow sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* RYOBI wordmark recreation */}
        <div className="flex items-center gap-2">
          <div className="bg-ryobi-yellow px-2 py-0.5">
            <span className="font-display text-ryobi-black font-black text-xl tracking-widest ryobi-heading">
              RYOBI
            </span>
          </div>
          {subtitle && (
            <span className="text-ryobi-gray text-xs font-semibold uppercase tracking-widest hidden sm:block">
              {subtitle}
            </span>
          )}
        </div>
        {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
      </div>
    </div>
  )
}
