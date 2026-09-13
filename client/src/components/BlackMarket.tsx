import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../auth/AuthContext"
import { useMarket, useUserStats } from "../lib/useData"
import type { MarketItem } from "../lib/types"

const RARITY_STYLES = {
  common: { color: "#8888aa", label: "COMMON", border: "#252540" },
  rare: { color: "#00f5d4", label: "RARE", border: "#00f5d440" },
  legendary: { color: "#f700ff", label: "LEGENDARY", border: "#f700ff40" },
}
const CATEGORIES = ["All", "Themes", "Badges", "Boosts"] as const

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton-decrypt rounded-sm ${className}`} />
}

function ItemCard({
  item,
  owned,
  credits,
  onBuy,
}: {
  item: MarketItem
  owned: boolean
  credits: number
  onBuy: (id: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [state, setState] = useState<"idle" | "buying" | "done" | "error">(
    "idle",
  )
  const [err, setErr] = useState("")
  const rarity = RARITY_STYLES[item.rarity]
  const canAfford = credits >= item.cost
  const isOwned = owned || state === "done"

  const handleBuy = async () => {
    setState("buying")
    setErr("")
    const result = await onBuy(item.id)
    if (result.ok) {
      setState("done")
    } else {
      setState("error")
      setErr(result.error ?? "Purchase failed.")
      setTimeout(() => {
        setState("idle")
        setErr("")
      }, 2500)
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="border rounded-sm p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{
        borderColor: isOwned ? "#39ff1440" : rarity.border,
        background: isOwned
          ? "rgba(57,255,20,0.04)"
          : item.rarity === "legendary"
            ? "rgba(247,0,255,0.03)"
            : "transparent",
      }}
    >
      {/* Legendary shimmer */}
      {item.rarity === "legendary" && !isOwned && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg,transparent 40%,rgba(247,0,255,0.04) 50%,transparent 60%)",
          }}
        />
      )}

      <div className="flex items-center justify-between">
        <span className="text-2xl" style={{ color: rarity.color }}>
          {item.icon}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 font-bold tracking-widest border"
          style={{ color: rarity.color, borderColor: rarity.border }}
        >
          {rarity.label}
        </span>
      </div>

      <div className="flex-1">
        <p className="text-[#e8e8f0] text-sm font-medium mb-1">{item.name}</p>
        <p className="text-[#444466] text-xs leading-relaxed">
          {item.description}
        </p>
        {err && <p className="text-[#ff2d55] text-xs mt-1">{err}</p>}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#1a1a2e]">
        <span className="text-[#ffb800] text-sm font-bold font-mono">
          {item.cost}¢
        </span>
        {isOwned ? (
          <span className="text-[#39ff14] text-xs tracking-widest glow-green">
            OWNED ✓
          </span>
        ) : (
          <button
            onClick={handleBuy}
            disabled={!canAfford || state === "buying"}
            className="px-3 py-1.5 text-xs font-bold tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border"
            style={{
              borderColor: canAfford ? rarity.color + "60" : "#444466",
              color: canAfford ? rarity.color : "#444466",
              background: canAfford ? rarity.color + "10" : "transparent",
            }}
          >
            {state === "buying" ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                ...
              </span>
            ) : canAfford ? (
              "ACQUIRE"
            ) : (
              "NO ¢"
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}

export default function BlackMarket({
  onNavigate,
}: {
  onNavigate: (p: string) => void
}) {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? "usr_demo"
  const { items, ownedIds, loading, buy } = useMarket(userId)
  const { data: stats, refetch: refetchStats } = useUserStats(userId)

  const [category, setCategory] =
    useState<"All" | "Themes" | "Badges" | "Boosts">("All")

  const filtered = items.filter(
    (i) => category === "All" || i.category === category,
  )

  const handleBuy = async (itemId: string) => {
    const result = await buy(itemId)
    if (result.ok) refetchStats()
    return result
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "transparent" }}
    >
      <header
        className="border-b border-[#f700ff]/10 px-3 sm:px-6 py-3 flex flex-wrap items-center gap-3 sm:gap-4"
        style={{
          background: "rgba(8,8,16,0.85)",
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
          className="text-[#f700ff] text-sm font-bold tracking-[0.2em] glow-magenta"
          style={{ fontFamily: "var(--font-display)" }}
        >
          BLACK MARKET
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[#ffb800] text-sm font-bold font-mono">
            {stats?.credits ?? "—"}¢
          </span>
          <span className="text-[#444466] text-xs">CREDITS</span>
        </div>
      </header>

      <div
        className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6"
        style={{ background: "rgba(8,8,16,0.55)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-[#f700ff]/20 p-4 rounded-sm"
          style={{ background: "rgba(247,0,255,0.03)" }}
        >
          <p className="text-[#f700ff] text-xs tracking-widest font-bold mb-1">
            ◆ HANDLER TRANSMISSION
          </p>
          <p className="text-[#8888aa] text-sm">
            "Everything here costs Credits, fixer. No questions asked. No
            refunds. Choose wisely."
          </p>
        </motion.div>

        <div className="flex gap-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 text-xs tracking-widest uppercase transition-all ${
                category === cat
                  ? "text-[#f700ff] border border-[#f700ff40]"
                  : "text-[#444466] border border-transparent hover:text-[#8888aa]"
              }`}
              style={{
                background:
                  category === cat ? "rgba(247,0,255,0.08)" : "transparent",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  owned={ownedIds.includes(item.id)}
                  credits={stats?.credits ?? 0}
                  onBuy={handleBuy}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
