// Place this file at: client/src/components/LevelUpSequence.tsx
//
// Placeholder for the Clearance Tier-up "wow moment" animation.
// Functional now (unblocks the build + is demoable), meant to be
// replaced with the full glitch/particle treatment as a polish pass.

import { useEffect } from "react"
import { motion } from "framer-motion"

interface LevelUpSequenceProps {
  fromTier: number
  toTier: number
  onDone: () => void
}

export default function LevelUpSequence({
  fromTier,
  toTier,
  onDone,
}: LevelUpSequenceProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2500)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center font-mono text-center px-4"
      style={{ background: "transparent" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-[#00f5d4] text-sm tracking-widest mb-4">
          CLEARANCE UPGRADE DETECTED
        </p>
        <motion.h1
          className="text-6xl font-bold mb-2"
          style={{ color: "#00f5d4" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          TIER {toTier}
        </motion.h1>
        <p className="text-[#666688] text-xs tracking-wide">
          Clearance Tier {fromTier} → {toTier}
        </p>
        <motion.button
          onClick={onDone}
          className="mt-8 text-xs text-[#333355] hover:text-[#00f5d4] transition-colors tracking-widest border border-[#1a1a2e] px-4 py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          [ CONTINUE ]
        </motion.button>
      </motion.div>
    </div>
  )
}
