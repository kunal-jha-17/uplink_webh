// Place this file at: client/src/components/HandlerToast.tsx
//
// Placeholder for The Handler's in-fiction transmission toast. Shows
// the line returned by lib/handler.ts. Functional now, safe to demo,
// meant to be polished later.

import { AnimatePresence, motion } from "framer-motion"
import type { HandlerEvent } from "../lib/handler"

export interface HandlerTransmission {
  id: number
  event: HandlerEvent
  line: string
  isFallback: boolean
}

interface HandlerToastProps {
  transmission: HandlerTransmission | null
  onDismiss: () => void
}

export default function HandlerToast({
  transmission,
  onDismiss,
}: HandlerToastProps) {
  return (
    <AnimatePresence>
      {transmission && (
        <motion.div
          key={transmission.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-4 left-4 z-50 max-w-sm border px-4 py-3 font-mono text-sm"
          style={{
            background: "#0d0d1acc",
            borderColor: "#00f5d4",
            color: "#e0e0f0",
          }}
        >
          <div className="text-[#00f5d4] text-[10px] tracking-widest mb-1">
            THE HANDLER {transmission.isFallback ? "(offline relay)" : ""}
          </div>
          <div>{transmission.line}</div>
          <button
            onClick={onDismiss}
            className="absolute top-1 right-2 text-[#666688] hover:text-[#00f5d4] text-xs"
            aria-label="Dismiss transmission"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
