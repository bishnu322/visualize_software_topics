import { motion } from 'framer-motion'

/** 32 bits split into octets, coloured as network (prefix) vs host bits. */
export function BinaryBits({ binary, prefix, label }: { binary: string; prefix: number; label?: string }) {
  const bits = binary.replace(/\./g, '').split('')
  return (
    <div>
      {label && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>}
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {[0, 1, 2, 3].map((o) => (
          <div key={o} className="flex gap-[2px]">
            {bits.slice(o * 8, o * 8 + 8).map((b, j) => {
              const idx = o * 8 + j
              const net = idx < prefix
              return (
                <motion.span
                  key={idx}
                  layout
                  className={`flex h-7 w-[18px] items-center justify-center rounded font-mono text-xs font-semibold sm:w-5 ${
                    net
                      ? 'bg-brand-500 text-white'
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200'
                  }`}
                  animate={{ scale: [1.15, 1] }}
                  transition={{ duration: 0.25 }}
                >
                  {b}
                </motion.span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
