import { useCallback, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "./auth/AuthContext"
import BootScreen from "./components/BootScreen"
import Dashboard from "./components/Dashboard"
import ContractsScreen from "./components/ContractsScreen"
import BountyPanel from "./components/BountyPanel"
import BlackMarket from "./components/BlackMarket"
import LevelUpSequence from "./components/LevelUpSequence"
import CyberpunkBackground from "./components/CyberpunkBackground"
import HandlerToast, {
  type HandlerTransmission,
} from "./components/HandlerToast"
import {
  fallbackHandlerLine,
  requestHandlerLine,
  type HandlerContext,
  type HandlerEvent,
} from "./lib/handler"

type AppPage = "dashboard" | "contracts" | "bounties" | "market" | "levelup"

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
} as const

export default function App() {
  const { user, logout } = useAuth()
  const [page, setPage] = useState<AppPage>("dashboard")
  const [transmission, setTransmission] = useState<HandlerTransmission | null>(
    null,
  )

  const notifyHandler = useCallback(
    async (event: HandlerEvent, context: HandlerContext) => {
      const line = await requestHandlerLine(event, context)
      setTransmission({
        id: Date.now(),
        event,
        line,
        isFallback: line === fallbackHandlerLine(event),
      })
    },
    [],
  )

  const navigate = (p: string) => {
    if (p === "boot") {
      logout()
      return
    }
    setPage(p as AppPage)
  }

  // Not authenticated — show boot/login
  if (!user) {
    return (
      <>
        <CyberpunkBackground />
        <div className="relative" style={{ zIndex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div key="boot" {...PAGE_TRANSITION}>
              <BootScreen onComplete={() => setPage("dashboard")} />
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    )
  }

  // Authenticated — main app
  return (
    <div
      className="min-h-screen font-mono"
      style={{ background: "transparent" }}
    >
      <CyberpunkBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">
          {page === "dashboard" && (
            <motion.div key="dashboard" {...PAGE_TRANSITION}>
              <Dashboard onNavigate={navigate} onHandlerEvent={notifyHandler} />
            </motion.div>
          )}
          {page === "contracts" && (
            <motion.div key="contracts" {...PAGE_TRANSITION}>
              <ContractsScreen
                onNavigate={navigate}
                onHandlerEvent={notifyHandler}
              />
            </motion.div>
          )}
          {page === "bounties" && (
            <motion.div key="bounties" {...PAGE_TRANSITION}>
              <BountyPanel
                onNavigate={navigate}
                onHandlerEvent={notifyHandler}
              />
            </motion.div>
          )}
          {page === "market" && (
            <motion.div key="market" {...PAGE_TRANSITION}>
              <BlackMarket onNavigate={navigate} />
            </motion.div>
          )}
          {page === "levelup" && (
            <motion.div key="levelup" {...PAGE_TRANSITION}>
              <LevelUpSequence
                fromTier={3}
                toTier={4}
                onDone={() => setPage("dashboard")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <HandlerToast
        transmission={transmission}
        onDismiss={() => setTransmission(null)}
      />
      {/* Dev shortcut — remove before hackathon demo */}
      {page !== "levelup" && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setPage("levelup")}
            className="text-[#333355] text-xs hover:text-[#00f5d4] transition-colors tracking-widest bg-[#0d0d1a] border border-[#1a1a2e] px-2 py-1"
          >
            [DEV] TIER UP
          </button>
        </div>
      )}
    </div>
  )
}
