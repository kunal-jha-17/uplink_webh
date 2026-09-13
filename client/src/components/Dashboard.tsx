import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../auth/AuthContext"
import { useUserStats, useContracts, useBounties } from "../lib/useData"
import { repForNextTier, DIFF_REP } from "../lib/types"
import type { Contract, Bounty } from "../lib/types"
import UptimeDecay from "./UptimeDecay"
import { SynergyHeaderBadge, SynergyPanelCard } from "./SynergyBadge"
import type { HandlerContext, HandlerEvent } from "../lib/handler"

const MODULE_COLORS: Record<string, string> = {
  Hacking: "#00f5d4",
  Combat: "#ff2d55",
  Intel: "#ffb800",
  Charisma: "#f700ff",
}

// ─── Rep progress bar ────────────────────────────────────────────────────────
function RepBar({ rep, tier }: { rep: number; tier: number }) {
  const target = repForNextTier(tier)
  const pct = Math.min(100, Math.round((rep / target) * 100))
  const TIER_NAMES = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
  ]

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[#8888aa] tracking-widest">
          TIER {TIER_NAMES[tier - 1]} → TIER {TIER_NAMES[tier]}
        </span>
        <span className="text-[#00f5d4] glow-teal font-bold">
          {rep.toLocaleString()} / {target.toLocaleString()} REP
        </span>
      </div>
      <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          style={{
            background: "linear-gradient(90deg,#00f5d4,#00c4aa)",
            boxShadow: "0 0 8px rgba(0,245,212,0.6)",
          }}
        />
        {[25, 50, 75].map((t) => (
          <div
            key={t}
            className="absolute top-0 bottom-0 w-px bg-[#0d0d1a]"
            style={{ left: `${t}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs mt-1 text-[#444466]">
        <span>{pct}% complete</span>
        <span>{(target - rep).toLocaleString()} REP to tier-up</span>
      </div>
    </div>
  )
}

// ─── Bounty card ─────────────────────────────────────────────────────────────
function BountyCard({
  bounty,
  onPay,
}: {
  bounty: Bounty
  onPay: (id: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [state, setState] = useState<"idle" | "paying" | "cleared" | "error">(
    "idle",
  )
  const [err, setErr] = useState("")

  const handlePay = async () => {
    setState("paying")
    const result = await onPay(bounty.id)
    if (result.ok) {
      setState("cleared")
    } else {
      setState("error")
      setErr(result.error ?? "Payment failed.")
      setTimeout(() => setState("idle"), 2500)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {state === "cleared" ? (
        <motion.div
          key="cleared"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="border border-[#39ff14]/40 p-3 rounded-sm text-center"
          style={{ background: "rgba(57,255,20,0.04)" }}
        >
          <span className="text-[#39ff14] text-xs glow-green tracking-widest">
            ✓ BOUNTY CLEARED — {bounty.label}
          </span>
        </motion.div>
      ) : (
        <motion.div
          key="active"
          layout
          exit={{ opacity: 0, x: 40, scale: 0.95 }}
          transition={{ duration: 0.35 }}
          className="border border-[#ff2d55]/40 p-3 rounded-sm animate-pulse-red"
          style={{ background: "rgba(255,45,85,0.04)" }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#ff2d55] text-xs">◈ BOUNTY</span>
                <span className="text-[#ff2d55] text-xs font-bold">
                  -{bounty.rep_penalty}% REP
                </span>
              </div>
              <p className="text-[#e8e8f0] text-xs truncate">{bounty.label}</p>
              {state === "error" && (
                <p className="text-[#ff2d55] text-xs mt-1">{err}</p>
              )}
            </div>
            <button
              onClick={handlePay}
              disabled={state === "paying"}
              className="shrink-0 px-3 py-1.5 border border-[#ffb800]/60 text-[#ffb800] text-xs tracking-widest hover:bg-[#ffb80010] active:scale-95 transition-all disabled:opacity-50"
            >
              {state === "paying" ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                  ...
                </span>
              ) : (
                `PAY ${bounty.credits_to_clear}¢`
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Contract row with optimistic UI ────────────────────────────────────────
function ContractRow({
  contract,
  onComplete,
}: {
  contract: Contract
  onComplete: (id: string) => Promise<Contract | null>
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">(
    contract.completed_at ? "done" : "idle",
  )
  const color = MODULE_COLORS[contract.module] || "#8888aa"

  const handleComplete = async () => {
    if (status !== "idle") return
    setStatus("saving") // optimistic
    const result = await onComplete(contract.id)
    if (result) {
      setStatus("done")
    } else {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2000)
    }
  }

  const isDone = status === "done"

  return (
    <motion.div
      layout
      className={`flex items-center gap-3 p-3 border rounded-sm transition-all ${
        isDone
          ? "border-[#1a1a2e] opacity-40"
          : "border-[#1a1a2e] hover:border-[#252540]"
      }`}
      style={{
        background: status === "error" ? "rgba(255,45,85,0.04)" : "transparent",
      }}
    >
      <button
        onClick={handleComplete}
        disabled={isDone || status === "saving"}
        className="w-4 h-4 border rounded-sm shrink-0 flex items-center justify-center transition-all"
        style={{
          borderColor: isDone
            ? "#39ff14"
            : status === "error"
              ? "#ff2d55"
              : color,
          backgroundColor: isDone ? "#39ff1420" : "transparent",
        }}
        aria-label="Complete contract"
      >
        {isDone && (
          <span className="text-[#39ff14] text-xs leading-none">✓</span>
        )}
        {status === "saving" && (
          <span
            className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin inline-block"
            style={{ borderColor: color }}
          />
        )}
        {status === "error" && (
          <span className="text-[#ff2d55] text-xs leading-none">✗</span>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            isDone ? "line-through text-[#444466]" : "text-[#e8e8f0]"
          }`}
        >
          {contract.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs" style={{ color }}>
            {contract.module}
          </span>
          <span className="text-[#444466] text-xs">·</span>
          <span className="text-[#8888aa] text-xs">{contract.difficulty}</span>
          <span className="text-[#444466] text-xs">·</span>
          <span className="text-[#444466] text-xs">{contract.due_date}</span>
        </div>
      </div>
      <span
        className="text-xs font-bold shrink-0"
        style={{ color: isDone ? "#444466" : color }}
      >
        +{DIFF_REP[contract.difficulty]} REP
      </span>
    </motion.div>
  )
}

// ─── Skeleton loader ─────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton-decrypt rounded-sm ${className}`} />
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard({
  onNavigate,
  onHandlerEvent,
}: {
  onNavigate: (page: string) => void
  onHandlerEvent: (event: HandlerEvent, context: HandlerContext) => void
}) {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? "usr_demo"
  const handle = authUser?.handle ?? "Ghost_V"
  const TIER_NAMES = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
  ]

  const {
    data: stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useUserStats(userId)
  const {
    contracts,
    loading: contractsLoading,
    complete: completeContract,
  } = useContracts(userId)
  const { bounties, clear: clearBounty } = useBounties(userId)

  // Keep the authoritative uptime timestamp and synergy state fresh while the
  // visible counter interpolates smoothly between backend snapshots.
  useEffect(() => {
    const interval = window.setInterval(() => {
      void refetchStats()
    }, 30_000)
    return () => window.clearInterval(interval)
  }, [refetchStats])

  const handleClearBounty = async (id: string) => {
    const result = await clearBounty(id)
    if (result.ok) {
      refetchStats()
      void onHandlerEvent("bounty_cleared", { credits: stats?.credits })
    }
    return result
  }

  const handleCompleteContract = async (id: string) => {
    const result = await completeContract(id)
    if (result) {
      refetchStats()
      void onHandlerEvent("contract_completed", {
        title: result.title,
        module: result.module,
        difficulty: result.difficulty,
      })
    }
    return result
  }

  const todayContracts = contracts.filter((c) => {
    const today = new Date().toISOString().slice(0, 10)
    return c.due_date === today || c.completed_at?.slice(0, 10) === today
  })

  const moduleActivity: Record<string, number> = {}
  contracts.forEach((c) => {
    if (c.completed_at)
      moduleActivity[c.module] = (moduleActivity[c.module] || 0) + 1
  })

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "transparent" }}
    >
      {/* Top bar */}
      <header
        className="border-b border-[#00f5d4]/10 px-3 sm:px-6 py-3 flex flex-wrap items-center gap-3 sm:gap-4"
        style={{
          background: "rgba(8,8,16,0.85)",
          backdropFilter: "blur(16px)",
        }}
      >
        <span
          className="text-[#00f5d4] text-sm font-bold tracking-[0.2em] glow-teal"
          style={{ fontFamily: "var(--font-display)" }}
        >
          UPLINK
        </span>
        <span className="text-[#1a1a2e]">│</span>
        <span className="text-[#8888aa] text-xs tracking-widest">
          OPERATOR: {handle.toUpperCase()}
        </span>
        <div className="ml-auto flex items-center gap-4">
          {stats && (
            <SynergyHeaderBadge
              active={stats.synergy_active}
              modules={stats.synergy_modules}
              multiplier={stats.rep_multiplier}
            />
          )}
          <span className="text-[#ffb800] text-xs font-bold">
            {statsLoading ? "—" : `${stats?.credits ?? 0}¢`}
          </span>
          <span className="text-[#1a1a2e]">│</span>
          <button
            onClick={() => onNavigate("boot")}
            className="text-[#444466] text-xs hover:text-[#ff2d55] transition-colors tracking-widest"
          >
            JACK OUT
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_280px] overflow-visible lg:overflow-hidden">
        {/* Sidebar */}
        <nav
          className="border-b lg:border-b-0 lg:border-r border-[#00f5d4]/10 p-3 sm:p-4 flex flex-row lg:flex-col gap-1 pt-3 lg:pt-6 overflow-x-auto"
          style={{
            background: "rgba(8,8,16,0.75)",
            backdropFilter: "blur(12px)",
          }}
        >
          {[
            { id: "dashboard", label: "DASHBOARD", icon: "◈" },
            { id: "contracts", label: "CONTRACTS", icon: "◻" },
            { id: "bounties", label: "BOUNTY PANEL", icon: "⚠" },
            { id: "market", label: "BLACK MARKET", icon: "◆" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest text-left transition-all rounded-sm ${
                item.id === "dashboard"
                  ? "text-[#00f5d4] bg-[#00f5d410] border-l-2 border-[#00f5d4]"
                  : "text-[#444466] hover:text-[#8888aa] hover:bg-[#ffffff04] border-l-2 border-transparent"
              }`}
            >
              <span
                style={{
                  color: item.id === "dashboard" ? "#00f5d4" : undefined,
                }}
              >
                {item.icon}
              </span>
              {item.label}
              {item.id === "bounties" && bounties.length > 0 && (
                <span className="ml-auto text-[#ff2d55] text-xs font-bold">
                  {bounties.length}
                </span>
              )}
            </button>
          ))}

          <div className="hidden lg:block mt-auto pt-4 border-t border-[#1a1a2e]">
            <div className="px-3 py-2">
              <p className="text-[#444466] text-xs mb-1">CLEARANCE</p>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p
                  className="text-[#00f5d4] text-xl font-bold font-mono glow-teal"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  TIER {TIER_NAMES[(stats?.clearance_tier ?? 1) - 1]}
                </p>
              )}
            </div>
          </div>
        </nav>

        {/* Main */}
        <main
          className="overflow-visible lg:overflow-y-auto p-4 sm:p-6 space-y-5 min-w-0"
          style={{ background: "rgba(8,8,16,0.55)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h1
              className="text-[#e8e8f0] text-sm font-bold tracking-wider mb-0.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              GOOD{" "}
              {new Date().getHours() < 12
                ? "MORNING"
                : new Date().getHours() < 18
                  ? "AFTERNOON"
                  : "EVENING"}
              , {handle.toUpperCase()}
            </h1>
            <p className="text-[#444466] text-xs tracking-wider">
              {new Date().toDateString().toUpperCase()} ·{" "}
              {bounties.length > 0 ? (
                <span className="text-[#ff2d55]">
                  {bounties.length} ACTIVE BOUNTY
                  {bounties.length > 1 ? "S" : ""}
                </span>
              ) : (
                <span className="text-[#39ff14]">NO ACTIVE BOUNTIES</span>
              )}
            </p>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {statsLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-[#1a1a2e] p-4 rounded-sm space-y-2"
                  >
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                ))
              : [
                  {
                    label: "REPUTATION",
                    value: stats?.rep.toLocaleString() ?? "—",
                    unit: "REP",
                    color: "#00f5d4",
                  },
                  {
                    label: "CREDITS",
                    value: stats?.credits.toLocaleString() ?? "—",
                    unit: "¢",
                    color: "#ffb800",
                  },
                  {
                    label: "DONE TODAY",
                    value: todayContracts.filter((c) => c.completed_at).length,
                    unit: `/ ${todayContracts.length}`,
                    color: "#f700ff",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-[#1a1a2e] p-4 rounded-sm hover:border-[#252540] transition-colors"
                  >
                    <p className="text-[#444466] text-xs tracking-widest mb-2">
                      {stat.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-2xl font-bold"
                        style={{
                          color: stat.color,
                          fontFamily: "var(--font-display)",
                          fontSize: "22px",
                        }}
                      >
                        {stat.value}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: stat.color + "80" }}
                      >
                        {stat.unit}
                      </span>
                    </div>
                  </div>
                ))}
          </motion.div>

          {/* Rep bar */}
          {!statsLoading && stats && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="border border-[#1a1a2e] p-4 rounded-sm"
            >
              <RepBar rep={stats.rep} tier={stats.clearance_tier} />
            </motion.div>
          )}

          {/* Live uptime decay — authoritative timestamp plus client interpolation */}
          {!statsLoading && stats && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <UptimeDecay
                uptimeActive={stats.uptime_active}
                uptimeBrokeAt={stats.uptime_broke_at}
              />
            </motion.div>
          )}

          {/* Today's contracts */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[#8888aa] text-xs tracking-widest uppercase">
                Today's Contracts
              </h2>
              <button
                onClick={() => onNavigate("contracts")}
                className="text-[#00f5d4] text-xs tracking-widest hover:glow-teal transition-all"
              >
                VIEW ALL →
              </button>
            </div>
            {contractsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {todayContracts.length === 0 && (
                  <p className="text-[#444466] text-xs text-center py-6 tracking-widest">
                    NO CONTRACTS DUE TODAY
                  </p>
                )}
                {todayContracts.map((c) => (
                  <ContractRow
                    key={c.id}
                    contract={c}
                    onComplete={handleCompleteContract}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </main>

        {/* Right panel */}
        <aside
          className="border-t lg:border-t-0 lg:border-l border-[#f700ff]/10 p-4 overflow-visible lg:overflow-y-auto space-y-5"
          style={{
            background: "rgba(8,8,16,0.75)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Skill modules */}
          <div>
            <h3 className="text-[#444466] text-xs tracking-widest mb-3 uppercase">
              Skill Modules
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(MODULE_COLORS).map((mod) => {
                const count = moduleActivity[mod] ?? 0
                const color = MODULE_COLORS[mod]
                return (
                  <div
                    key={mod}
                    className="p-3 border rounded-sm transition-all"
                    style={{
                      borderColor: count > 0 ? color + "50" : "#1a1a2e",
                      background: count > 0 ? color + "08" : "transparent",
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className="text-xs tracking-widest"
                        style={{ color: count > 0 ? color : "#444466" }}
                      >
                        {mod.slice(0, 4).toUpperCase()}
                      </span>
                      {count > 0 && (
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </div>
                    <span
                      className="text-lg font-bold font-mono"
                      style={{ color: count > 0 ? color : "#333355" }}
                    >
                      {count}
                    </span>
                    <p className="text-[#444466] text-xs">done</p>
                  </div>
                )
              })}
            </div>
            {stats && (
              <div className="mt-3">
                <SynergyPanelCard
                  active={stats.synergy_active}
                  modules={stats.synergy_modules}
                  multiplier={stats.rep_multiplier}
                  variant="panel"
                />
              </div>
            )}
          </div>

          {/* Active bounties */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#444466] text-xs tracking-widest uppercase">
                Active Bounties
              </h3>
              {bounties.length > 0 && (
                <span className="text-[#ff2d55] text-xs font-bold">
                  {bounties.length}
                </span>
              )}
            </div>
            {bounties.length === 0 ? (
              <div className="p-3 border border-[#1a1a2e] text-center">
                <p className="text-[#39ff14] text-xs glow-green">
                  NO BOUNTIES ACTIVE
                </p>
                <p className="text-[#444466] text-xs mt-1">Clean record.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bounties.map((b) => (
                  <BountyCard key={b.id} bounty={b} onPay={handleClearBounty} />
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h3 className="text-[#444466] text-xs tracking-widest mb-3 uppercase">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: "+ NEW CONTRACT",
                  action: "contracts",
                  color: "#00f5d4",
                },
                { label: "◆ BLACK MARKET", action: "market", color: "#f700ff" },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => onNavigate(a.action)}
                  className="w-full py-2.5 border text-xs tracking-widest transition-all hover:opacity-80 active:scale-[0.99]"
                  style={{
                    borderColor: a.color + "40",
                    color: a.color,
                    background: a.color + "08",
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
