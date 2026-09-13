import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../auth/AuthContext"
import { useBounties, useUserStats } from "../lib/useData"
import type { Bounty } from "../lib/types"
import type { HandlerContext, HandlerEvent } from "../lib/handler"

const SEV = {
  high: {
    border: "#ff2d55",
    bg: "rgba(255,45,85,0.05)",
    label: "CRITICAL",
    pulse: true,
    icon: "◈◈◈",
  },
  medium: {
    border: "#ffb800",
    bg: "rgba(255,184,0,0.04)",
    label: "ELEVATED",
    pulse: false,
    icon: "◈◈",
  },
  low: {
    border: "#ffb800",
    bg: "rgba(255,184,0,0.02)",
    label: "LOW",
    pulse: false,
    icon: "◈",
  },
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-decrypt rounded-sm ${className}`} />
}

// ── Live drain timer on each bounty ──────────────────────────────────────────
function BountyTimer({
  createdAt,
  hoursActive,
}: {
  createdAt: string
  hoursActive: number
}) {
  const start = new Date(createdAt).getTime()
  const [elapsed, setElapsed] = useState(Date.now() - start)

  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - start), 1000)
    return () => clearInterval(id)
  }, [start])

  const totalSecs = Math.floor(elapsed / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60

  return (
    <span className="font-mono tabular-nums text-[#ff2d55] text-xs">
      {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:
      {String(s).padStart(2, "0")}
    </span>
  )
}

// ── Individual bounty card ────────────────────────────────────────────────────
function BountyCard({
  bounty,
  userCredits,
  onClear,
}: {
  bounty: Bounty
  userCredits: number
  onClear: (id: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [phase, setPhase] =
    useState<"idle" | "confirm" | "clearing" | "cleared" | "error">("idle")
  const [errMsg, setErrMsg] = useState("")
  const style = SEV[bounty.severity]
  const canAfford = userCredits >= bounty.credits_to_clear

  const handleClear = async () => {
    if (phase === "confirm") {
      setPhase("clearing")
      const result = await onClear(bounty.id)
      if (result.ok) {
        setPhase("cleared")
      } else {
        setPhase("error")
        setErrMsg(result.error ?? "Payment failed.")
        setTimeout(() => {
          setPhase("idle")
          setErrMsg("")
        }, 3000)
      }
    } else {
      setPhase("confirm")
    }
  }

  return (
    <AnimatePresence mode="wait">
      {phase === "cleared" ? (
        <motion.div
          key="cleared"
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94, x: 40 }}
          transition={{ duration: 0.4 }}
          className="border border-[#39ff14]/40 p-4 rounded-sm"
          style={{ background: "rgba(57,255,20,0.05)" }}
        >
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-[#39ff14] text-2xl glow-green"
            >
              ✓
            </motion.span>
            <div>
              <p className="text-[#39ff14] text-sm font-bold glow-green">
                BOUNTY CLEARED
              </p>
              <p className="text-[#8888aa] text-xs mt-0.5">
                {bounty.label} · -{bounty.rep_penalty}% penalty lifted ·{" "}
                {bounty.credits_to_clear}¢ deducted
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="active"
          layout
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className={`border rounded-sm overflow-hidden ${
            style.pulse ? "animate-pulse-red" : ""
          }`}
          style={{ borderColor: style.border + "55", background: style.bg }}
        >
          {/* Severity top bar */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{
              borderColor: style.border + "20",
              background: style.border + "08",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: style.border }}>
                {style.icon}
              </span>
              <span
                className="text-xs font-bold tracking-widest"
                style={{ color: style.border }}
              >
                {style.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#444466] text-xs">ACTIVE:</span>
              <BountyTimer
                createdAt={bounty.created_at}
                hoursActive={bounty.hours_active}
              />
            </div>
          </div>

          <div className="p-4 flex flex-col sm:flex-row items-start gap-4">
            <div className="flex-1 min-w-0">
              {/* Title + reason */}
              <p className="text-[#e8e8f0] text-sm font-medium mb-0.5">
                {bounty.label}
              </p>
              <p className="text-[#8888aa] text-xs mb-3">{bounty.reason}</p>

              {/* Penalty bar */}
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-[#444466] tracking-wide">REP DRAIN</span>
                <span className="font-bold" style={{ color: style.border }}>
                  -{bounty.rep_penalty}% on all gains
                </span>
              </div>
              <div className="h-2 bg-[#0d0d1a] rounded-full overflow-hidden mb-3">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.min(100, bounty.rep_penalty * 2.5)}%`,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{
                    background: `linear-gradient(90deg, ${style.border}80, ${style.border})`,
                  }}
                />
              </div>

              {/* Error */}
              {phase === "error" && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[#ff2d55] text-xs glow-red"
                >
                  {errMsg}
                </motion.p>
              )}
            </div>

            {/* Pay-down panel */}
            <div className="w-full sm:w-auto shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 sm:min-w-[120px]">
              <div className="text-right mb-1">
                <p className="text-[#444466] text-xs tracking-wide">
                  CLEAR COST
                </p>
                <p className="text-[#ffb800] text-2xl font-bold font-mono">
                  {bounty.credits_to_clear}¢
                </p>
                {!canAfford && (
                  <p className="text-[#ff2d55] text-xs mt-0.5">
                    Need {bounty.credits_to_clear - userCredits}¢ more
                  </p>
                )}
              </div>

              {/* Confirm / Pay button */}
              <AnimatePresence mode="wait">
                {phase === "confirm" ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-1"
                  >
                    <button
                      onClick={() => setPhase("idle")}
                      className="px-2 py-1.5 text-xs border border-[#252540] text-[#444466] hover:text-[#8888aa] transition-colors"
                    >
                      NO
                    </button>
                    <button
                      onClick={handleClear}
                      className="px-3 py-1.5 text-xs font-bold tracking-widest text-[#080810] transition-all hover:opacity-90"
                      style={{ background: "#ffb800" }}
                    >
                      CONFIRM
                    </button>
                  </motion.div>
                ) : phase === "clearing" ? (
                  <motion.div
                    key="clearing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-xs text-[#ffb800]"
                  >
                    <span className="w-4 h-4 border-2 border-[#ffb800] border-t-transparent rounded-full animate-spin inline-block" />
                    CLEARING...
                  </motion.div>
                ) : (
                  <motion.button
                    key="pay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={canAfford ? handleClear : undefined}
                    disabled={!canAfford}
                    className="px-4 py-2 text-xs font-bold tracking-widest border transition-all active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
                    style={{
                      borderColor: canAfford ? "#ffb80060" : "#333355",
                      color: canAfford ? "#ffb800" : "#444466",
                      background: canAfford
                        ? "rgba(255,184,0,0.08)"
                        : "transparent",
                    }}
                  >
                    {canAfford ? "PAY DOWN →" : "INSUFFICIENT ¢"}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Rep penalty summary bar ───────────────────────────────────────────────────
function PenaltyMeter({ bounties }: { bounties: Bounty[] }) {
  const total = Math.min(
    100,
    bounties.reduce((s, b) => s + b.rep_penalty, 0),
  )
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-[#444466] tracking-widest">
          COMBINED REP PENALTY
        </span>
        <span className="text-[#ff2d55] font-bold glow-red">-{total}%</span>
      </div>
      <div className="h-3 bg-[#0d0d1a] rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${total}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            background: "linear-gradient(90deg,#ffb800,#ff2d55)",
            boxShadow: "0 0 8px rgba(255,45,85,0.4)",
          }}
        />
        {/* Threshold marks */}
        {[25, 50, 75].map((t) => (
          <div
            key={t}
            className="absolute top-0 bottom-0 w-px bg-[#080810]"
            style={{ left: `${t}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs mt-1 text-[#333355]">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function BountyPanel({
  onNavigate,
  onHandlerEvent,
}: {
  onNavigate: (p: string) => void
  onHandlerEvent: (event: HandlerEvent, context: HandlerContext) => void
}) {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? "usr_demo"

  const { bounties, loading, clear } = useBounties(userId)
  const { data: stats, refetch: refetchStats } = useUserStats(userId)

  const credits = stats?.credits ?? 0
  const totalPenalty = bounties.reduce((s, b) => s + b.rep_penalty, 0)
  const totalCost = bounties.reduce((s, b) => s + b.credits_to_clear, 0)
  const canClearAll = credits >= totalCost && bounties.length > 0

  const handleClear = async (id: string) => {
    const result = await clear(id)
    if (result.ok) {
      refetchStats()
      const bounty = bounties.find((item) => item.id === id)
      void onHandlerEvent("bounty_cleared", {
        bountyLabel: bounty?.label,
        credits: bounty?.credits_to_clear,
      })
    }
    return result
  }

  const handleClearAll = async () => {
    for (const b of bounties) {
      if (credits >= b.credits_to_clear) await handleClear(b.id)
    }
  }

  // Sort: high severity first
  const sorted = [...bounties].sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 }
    return rank[a.severity] - rank[b.severity]
  })

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "transparent" }}
    >
      {/* Header */}
      <header
        className="border-b border-[#ff2d55]/10 px-3 sm:px-6 py-3 flex flex-wrap items-center gap-3 sm:gap-4"
        style={{
          background: "rgba(8,8,16,0.88)",
          backdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => onNavigate("dashboard")}
          className="text-[#444466] text-xs hover:text-[#00f5d4] transition-colors tracking-widest"
        >
          ← BACK
        </button>
        <span className="text-[#1a1a2e]">│</span>
        <span
          className="text-[#ff2d55] text-sm font-bold tracking-[0.2em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          BOUNTY PANEL
        </span>
        {bounties.length > 0 && (
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-[#ff2d55] text-xs font-bold border border-[#ff2d5540] px-2 py-0.5"
            style={{ background: "rgba(255,45,85,0.08)" }}
          >
            {bounties.length} ACTIVE
          </motion.span>
        )}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[#ffb800] text-xs font-bold">{credits}¢</span>
          {canClearAll && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 border border-[#ffb800]/50 text-[#ffb800] text-xs font-bold tracking-widest hover:bg-[#ffb80010] transition-all"
            >
              CLEAR ALL ({totalCost}¢)
            </button>
          )}
        </div>
      </header>

      <div
        className="flex-1 p-4 sm:p-6 max-w-3xl mx-auto w-full space-y-5"
        style={{ background: "rgba(8,8,16,0.55)" }}
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : bounties.length === 0 ? (
          /* All clear */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-[#39ff14]/40 p-10 rounded-sm text-center"
            style={{ background: "rgba(57,255,20,0.04)" }}
          >
            <motion.p
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[#39ff14] text-4xl glow-green mb-4"
            >
              ◈
            </motion.p>
            <p className="text-[#39ff14] font-bold text-base tracking-widest glow-green mb-2">
              NO ACTIVE BOUNTIES
            </p>
            <p className="text-[#8888aa] text-xs leading-relaxed">
              Full REP gain active. Keep your Contracts on schedule, fixer.
            </p>
            <button
              onClick={() => onNavigate("contracts")}
              className="mt-6 px-6 py-2 border border-[#39ff14]/40 text-[#39ff14] text-xs font-bold tracking-widest hover:bg-[#39ff1410] transition-colors"
            >
              → VIEW CONTRACTS
            </button>
          </motion.div>
        ) : (
          <>
            {/* Status banner */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-[#ff2d55]/40 p-5 rounded-sm"
              style={{ background: "rgba(255,45,85,0.04)" }}
            >
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-[#ff2d55] text-xs font-bold tracking-widest mb-1 glow-red">
                    ⚠ BOUNTY SYSTEM ACTIVE
                  </p>
                  <p className="text-[#8888aa] text-xs leading-relaxed max-w-xs">
                    {bounties.length} active{" "}
                    {bounties.length === 1 ? "bounty is" : "bounties are"}{" "}
                    draining your Rep gain. Clear them to restore full earnings.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-[#ff2d55] text-4xl font-black glow-red tabular-nums"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    -{totalPenalty}%
                  </p>
                  <p className="text-[#444466] text-xs mt-0.5">
                    TOTAL REP PENALTY
                  </p>
                </div>
              </div>
              <PenaltyMeter bounties={bounties} />
            </motion.div>

            {/* Bounty cards */}
            <div className="space-y-3">
              <AnimatePresence>
                {sorted.map((b) => (
                  <BountyCard
                    key={b.id}
                    bounty={b}
                    userCredits={credits}
                    onClear={handleClear}
                  />
                ))}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* How it works */}
        <div className="border border-[#1a1a2e] p-4 rounded-sm mt-2">
          <p className="text-[#333355] text-xs tracking-widest mb-3 uppercase">
            How Bounties Work
          </p>
          <div className="space-y-2">
            {[
              [
                "◈",
                "#ff2d55",
                "Missing a Contract deadline spawns a Bounty that drains your Rep gain percentage.",
              ],
              [
                "◈",
                "#ffb800",
                "Multiple Bounties stack — their penalties combine on every Rep transaction.",
              ],
              [
                "◈",
                "#00f5d4",
                "Pay Credits to clear a Bounty instantly and lift the penalty.",
              ],
              [
                "◈",
                "#444466",
                "Bounties persist across sessions. There is no forgiveness in the Net.",
              ],
            ].map(([icon, color, text], i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs mt-0.5 shrink-0" style={{ color }}>
                  {icon}
                </span>
                <p className="text-[#8888aa] text-xs leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
