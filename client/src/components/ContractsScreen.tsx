import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "../auth/AuthContext"
import { useContracts, useUserStats } from "../lib/useData"
import { DIFF_REP } from "../lib/types"
import type { Contract } from "../lib/types"
import type { HandlerContext, HandlerEvent } from "../lib/handler"

const MODULE_COLORS: Record<string, string> = {
  Hacking: "#00f5d4",
  Combat: "#ff2d55",
  Intel: "#ffb800",
  Charisma: "#f700ff",
}
const MODULES = ["Hacking", "Combat", "Intel", "Charisma"] as const
const DIFFS = ["Easy", "Medium", "Hard", "Boss"] as const
const DIFF_COLOR: Record<string, string> = {
  Easy: "#39ff14",
  Medium: "#ffb800",
  Hard: "#ff2d55",
  Boss: "#f700ff",
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isOverdue(c: Contract) {
  return (
    !c.completed_at &&
    !c.failed &&
    new Date(c.due_date) < new Date(new Date().setHours(0, 0, 0, 0))
  )
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-decrypt rounded-sm ${className}`} />
}

// ── Contract form modal ───────────────────────────────────────────────────────
function ContractModal({
  userId,
  initial,
  onSave,
  onClose,
}: {
  userId: string
  initial?: Contract
  onSave: (
    data: Omit<Contract, "id" | "completed_at" | "failed" | "created_at">,
  ) => Promise<void>
  onClose: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [module, setModule] = useState<Contract["module"]>(
    initial?.module ?? "Hacking",
  )
  const [difficulty, setDifficulty] = useState<Contract["difficulty"]>(
    initial?.difficulty ?? "Medium",
  )
  const [due, setDue] = useState(
    initial?.due_date ?? new Date().toISOString().slice(0, 10),
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErr("ERR: Contract objective required.")
      return
    }
    setSaving(true)
    try {
      await onSave({
        user_id: userId,
        title: title.trim(),
        module,
        difficulty,
        due_date: due,
      })
      onClose()
    } catch (ex: unknown) {
      setErr((ex as Error).message)
      setSaving(false)
    }
  }

  const repValue = DIFF_REP[difficulty]
  const color = MODULE_COLORS[module]

  const inputCls =
    "w-full bg-[#080810] border border-[#252540] px-3 py-2.5 text-[#e8e8f0] text-sm font-mono focus:border-[#00f5d4] outline-none transition-colors placeholder-[#333355] caret-[#00f5d4]"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contract-modal-title"
      style={{ background: "rgba(4,4,10,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 16, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="w-full max-w-lg border rounded-sm overflow-hidden"
        style={{ background: "rgba(10,10,20,0.97)", borderColor: color + "40" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: color + "20", background: color + "08" }}
        >
          <div>
            <p
              id="contract-modal-title"
              className="text-xs tracking-widest mb-0.5"
              style={{ color }}
            >
              {initial ? "EDIT CONTRACT" : "NEW CONTRACT"}
            </p>
            <p className="text-[#444466] text-xs">
              {initial
                ? `Modifying: ${initial.title}`
                : "Deploy a new objective to the ledger"}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close contract dialog"
            className="text-[#444466] hover:text-[#e8e8f0] transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="contract-objective"
              className="text-[#444466] text-xs tracking-widest block mb-1.5"
            >
              OBJECTIVE
            </label>
            <input
              id="contract-objective"
              ref={inputRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setErr("")
              }}
              placeholder="Describe the contract objective..."
              className={inputCls}
            />
          </div>

          {/* Module + Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#444466] text-xs tracking-widest block mb-1.5">
                SKILL MODULE
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODULES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModule(m)}
                    className="py-2 text-xs tracking-wide border transition-all"
                    style={{
                      borderColor:
                        module === m ? MODULE_COLORS[m] + "80" : "#252540",
                      color: module === m ? MODULE_COLORS[m] : "#444466",
                      background:
                        module === m ? MODULE_COLORS[m] + "12" : "transparent",
                    }}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[#444466] text-xs tracking-widest block mb-1.5">
                DIFFICULTY
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {DIFFS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className="py-2 text-xs tracking-wide border transition-all"
                    style={{
                      borderColor:
                        difficulty === d ? DIFF_COLOR[d] + "80" : "#252540",
                      color: difficulty === d ? DIFF_COLOR[d] : "#444466",
                      background:
                        difficulty === d ? DIFF_COLOR[d] + "12" : "transparent",
                    }}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label
              htmlFor="contract-deadline"
              className="text-[#444466] text-xs tracking-widest block mb-1.5"
            >
              DEADLINE
            </label>
            <input
              id="contract-deadline"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className={inputCls}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>

          {/* Rep preview */}
          <div
            className="flex items-center justify-between px-3 py-2 border rounded-sm"
            style={{ borderColor: color + "30", background: color + "06" }}
          >
            <span className="text-[#8888aa] text-xs tracking-wide">
              Rep reward on completion
            </span>
            <span className="font-bold text-sm" style={{ color }}>
              +{repValue} REP
            </span>
          </div>

          {err && (
            <motion.p
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[#ff2d55] text-xs glow-red"
            >
              {err}
            </motion.p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs text-[#444466] hover:text-[#8888aa] tracking-widest transition-colors border border-transparent hover:border-[#252540]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-xs font-bold tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
              style={{ background: color, color: "#080810" }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-[#080810] border-t-transparent rounded-full animate-spin inline-block" />
                  DEPLOYING...
                </span>
              ) : initial ? (
                "SAVE CHANGES"
              ) : (
                "DEPLOY CONTRACT"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({
  title,
  onConfirm,
  onCancel,
}: {
  title: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(4,4,10,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="w-full max-w-sm border border-[#ff2d55]/40 rounded-sm p-6 text-center"
        style={{ background: "rgba(10,10,20,0.97)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[#ff2d55] text-2xl mb-3">⚠</p>
        <p className="text-[#e8e8f0] text-sm font-bold mb-1">ABORT CONTRACT?</p>
        <p className="text-[#8888aa] text-xs mb-5 leading-relaxed">
          "<span className="text-[#e8e8f0]">{title}</span>" will be permanently
          erased from the ledger.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-[#252540] text-xs text-[#444466] hover:text-[#8888aa] tracking-widest transition-colors"
          >
            KEEP
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-[#ff2d55] text-[#080810] text-xs font-bold tracking-widest hover:bg-[#e02040] transition-colors"
          >
            ABORT
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Contract card ─────────────────────────────────────────────────────────────
function ContractCard({
  contract,
  onComplete,
  onDelete,
  onEdit,
  onHandlerEvent,
}: {
  contract: Contract
  onComplete: (id: string) => Promise<Contract | null>
  onDelete: (id: string) => Promise<void>
  onEdit: (c: Contract) => void
  onHandlerEvent: (event: HandlerEvent, context: HandlerContext) => void
}) {
  const [completing, setCompleting] = useState(false)
  const [syncErr, setSyncErr] = useState("")
  const [showDel, setShowDel] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const color = MODULE_COLORS[contract.module]
  const isDone = !!contract.completed_at
  const overdue = isOverdue(contract)

  useEffect(() => {
    if (!contract.failed) return
    void onHandlerEvent("contract_failed", {
      title: contract.title,
      module: contract.module,
      difficulty: contract.difficulty,
    })
  }, [
    contract.failed,
    contract.id,
    contract.title,
    contract.module,
    contract.difficulty,
    onHandlerEvent,
  ])

  const handleComplete = async () => {
    if (isDone || completing) return
    setSyncErr("")
    setCompleting(true)
    const result = await onComplete(contract.id)
    if (!result) {
      setSyncErr("Sync failed — roll back.")
      setCompleting(false)
    }
  }

  const handleDelete = async () => {
    setShowDel(false)
    setDeleting(true)
    await onDelete(contract.id)
  }

  return (
    <>
      <AnimatePresence>
        {showDel && (
          <DeleteConfirm
            title={contract.title}
            onConfirm={handleDelete}
            onCancel={() => setShowDel(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        animate={{ opacity: deleting ? 0.3 : 1 }}
        className={`group border rounded-sm p-4 transition-colors ${
          isDone
            ? "border-[#1a1a2e] opacity-50"
            : contract.failed
              ? "border-[#ff2d55]/25"
              : overdue
                ? "border-[#ffb800]/35"
                : "border-[#1a1a2e] hover:border-[#2a2a44]"
        }`}
        style={{
          background: contract.failed
            ? "rgba(255,45,85,0.03)"
            : overdue
              ? "rgba(255,184,0,0.025)"
              : "transparent",
        }}
      >
        <div className="flex items-start gap-3">
          {/* Complete button */}
          {contract.failed ? (
            <div className="mt-0.5 w-5 h-5 border border-[#ff2d55]/50 flex items-center justify-center shrink-0">
              <span className="text-[#ff2d55] text-xs">✗</span>
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isDone || completing}
              aria-label={isDone ? "Completed" : "Mark complete"}
              className="mt-0.5 w-5 h-5 border rounded-sm flex items-center justify-center shrink-0 transition-all hover:scale-110"
              style={{
                borderColor: isDone ? "#39ff14" : color,
                background: isDone ? "#39ff1420" : "transparent",
              }}
            >
              {isDone && <span className="text-[#39ff14] text-xs">✓</span>}
              {completing && (
                <span
                  className="w-2.5 h-2.5 border border-t-transparent rounded-full animate-spin inline-block"
                  style={{ borderColor: color }}
                />
              )}
            </button>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <span
                className={`text-sm leading-snug ${
                  isDone ? "line-through text-[#444466]" : "text-[#e8e8f0]"
                }`}
              >
                {contract.title}
              </span>
              {contract.failed && (
                <span className="text-[#ff2d55] text-xs px-1.5 py-0.5 border border-[#ff2d5540] shrink-0">
                  BOUNTY SPAWNED
                </span>
              )}
              {overdue && (
                <span className="text-[#ffb800] text-xs animate-pulse shrink-0">
                  ⚠ OVERDUE
                </span>
              )}
            </div>

            {syncErr && (
              <p className="text-[#ff2d55] text-xs mb-1">{syncErr}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs px-1.5 py-0.5 border font-mono"
                style={{ borderColor: color + "40", color }}
              >
                {contract.module.toUpperCase()}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: DIFF_COLOR[contract.difficulty] }}
              >
                {contract.difficulty.toUpperCase()}
              </span>
              <span className="text-[#444466] text-xs">·</span>
              <span className="text-[#444466] text-xs">
                Due {contract.due_date}
              </span>
            </div>
          </div>

          {/* Rep + actions */}
          <div className="flex items-center gap-3 shrink-0 max-w-full overflow-x-auto">
            <span
              className="text-xs font-bold tabular-nums"
              style={{
                color: isDone
                  ? "#39ff14"
                  : contract.failed
                    ? "#ff2d5560"
                    : color,
              }}
            >
              {isDone ? "✓ +" : contract.failed ? "BOUNTY" : "+"}
              {!contract.failed && `${DIFF_REP[contract.difficulty]} REP`}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isDone && !contract.failed && (
                <button
                  onClick={() => onEdit(contract)}
                  className="text-[#444466] text-xs hover:text-[#8888aa] transition-colors px-1.5 py-1 border border-transparent hover:border-[#252540]"
                >
                  EDIT
                </button>
              )}
              <button
                onClick={() => setShowDel(true)}
                className="text-[#444466] text-xs hover:text-[#ff2d55] transition-colors px-1.5 py-1 border border-transparent hover:border-[#ff2d5540]"
              >
                DEL
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
type StatusFilter = "all" | "active" | "completed" | "failed"
type SortKey = "due" | "rep" | "created"

export default function ContractsScreen({
  onNavigate,
  onHandlerEvent,
}: {
  onNavigate: (p: string) => void
  onHandlerEvent: (event: HandlerEvent, context: HandlerContext) => void
}) {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? "usr_demo"

  const { contracts, loading, complete, create, remove, update, refetch } =
    useContracts(userId)
  const { data: stats, refetch: refetchStats } = useUserStats(userId)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [modFilter, setModFilter] = useState("all")
  const [sort, setSort] = useState<SortKey>("due")
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Contract | null>(null)

  const filtered = contracts
    .filter((c) => {
      const sm =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? !c.completed_at && !c.failed
            : statusFilter === "completed"
              ? !!c.completed_at
              : c.failed
      return sm && (modFilter === "all" || c.module === modFilter)
    })
    .sort((a, b) => {
      if (sort === "due") return a.due_date.localeCompare(b.due_date)
      if (sort === "rep") return DIFF_REP[b.difficulty] - DIFF_REP[a.difficulty]
      return b.created_at.localeCompare(a.created_at)
    })

  const counts = {
    active: contracts.filter((c) => !c.completed_at && !c.failed).length,
    completed: contracts.filter((c) => !!c.completed_at).length,
    failed: contracts.filter((c) => c.failed).length,
  }

  const totalRepPending = contracts
    .filter((c) => !c.completed_at && !c.failed)
    .reduce((s, c) => s + DIFF_REP[c.difficulty], 0)

  const handleCreate = async (
    data: Omit<Contract, "id" | "completed_at" | "failed" | "created_at">,
  ) => {
    await create(data)
  }

  const handleEdit = async (
    data: Omit<Contract, "id" | "completed_at" | "failed" | "created_at">,
  ) => {
    if (!editTarget) return
    await update(editTarget.id, data)
    setEditTarget(null)
  }

  const handleComplete = async (id: string) => {
    const result = await complete(id)
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

  return (
    <>
      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <ContractModal
            userId={userId}
            onSave={handleCreate}
            onClose={() => setShowModal(false)}
          />
        )}
        {editTarget && (
          <ContractModal
            userId={userId}
            initial={editTarget}
            onSave={handleEdit}
            onClose={() => setEditTarget(null)}
          />
        )}
      </AnimatePresence>

      <div
        className="min-h-screen flex flex-col"
        style={{ background: "transparent" }}
      >
        {/* Header */}
        <header
          className="border-b border-[#00f5d4]/10 px-3 sm:px-6 py-3 flex flex-wrap items-center gap-3 sm:gap-4"
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
            className="text-[#00f5d4] text-sm font-bold tracking-[0.2em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CONTRACTS
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-[#ffb800] text-xs font-bold">
              {stats?.credits ?? "—"}¢
            </span>
            <span className="text-[#8888aa] text-xs">
              <span className="text-[#00f5d4] font-bold">{counts.active}</span>{" "}
              active ·{" "}
              <span className="text-[#39ff14] font-bold">
                {counts.completed}
              </span>{" "}
              done ·{" "}
              <span className="text-[#ff2d55] font-bold">{counts.failed}</span>{" "}
              failed
            </span>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-1.5 bg-[#00f5d4] text-[#080810] text-xs font-bold tracking-widest hover:bg-[#00c4aa] active:scale-[0.98] transition-all"
            >
              + NEW CONTRACT
            </button>
          </div>
        </header>

        <div
          className="flex-1 flex flex-col"
          style={{ background: "rgba(8,8,16,0.55)" }}
        >
          {/* Stats strip */}
          <div className="border-b border-[#1a1a2e] px-4 sm:px-6 py-3 flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[#444466] text-xs tracking-widest">
                PENDING REP
              </span>
              <span className="text-[#00f5d4] text-sm font-bold glow-teal">
                +{totalRepPending}
              </span>
            </div>
            <div className="h-4 w-px bg-[#1a1a2e]" />
            <div className="flex items-center gap-2">
              <span className="text-[#444466] text-xs tracking-widest">
                OVERDUE
              </span>
              <span
                className={`text-sm font-bold ${
                  contracts.filter(isOverdue).length > 0
                    ? "text-[#ffb800]"
                    : "text-[#39ff14]"
                }`}
              >
                {contracts.filter(isOverdue).length}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="text-[#444466] text-xs mr-2 tracking-widest">
                SORT:
              </span>
              {(["due", "rep", "created"] as SortKey[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-2 py-1 text-xs tracking-widest transition-all ${
                    sort === s
                      ? "text-[#00f5d4] bg-[#00f5d410]"
                      : "text-[#444466] hover:text-[#8888aa]"
                  }`}
                >
                  {s === "due"
                    ? "DEADLINE"
                    : s === "rep"
                      ? "REP VALUE"
                      : "NEWEST"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col md:flex-row overflow-visible md:overflow-hidden">
            {/* Left sidebar filters */}
            <div
              className="w-full md:w-40 border-b md:border-b-0 md:border-r border-[#1a1a2e] p-3 sm:p-4 flex flex-row md:flex-col gap-1 shrink-0 overflow-x-auto"
              style={{ background: "rgba(8,8,16,0.4)" }}
            >
              <p className="text-[#333355] text-xs tracking-widest mb-2 uppercase">
                Status
              </p>
              {([
                { key: "all", label: "ALL", count: contracts.length },
                { key: "active", label: "ACTIVE", count: counts.active },
                {
                  key: "completed",
                  label: "COMPLETED",
                  count: counts.completed,
                },
                { key: "failed", label: "FAILED", count: counts.failed },
              ] as { key: StatusFilter; label: string; count: number }[]).map(
                (f) => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    className={`flex items-center justify-between px-2.5 py-2 text-xs tracking-wide rounded-sm transition-all text-left ${
                      statusFilter === f.key
                        ? "text-[#00f5d4] bg-[#00f5d410] border-l-2 border-[#00f5d4]"
                        : "text-[#444466] hover:text-[#8888aa] border-l-2 border-transparent"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`text-xs font-bold ${
                        statusFilter === f.key
                          ? "text-[#00f5d4]"
                          : "text-[#333355]"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ),
              )}

              <p className="text-[#333355] text-xs tracking-widest mt-4 mb-2 uppercase">
                Module
              </p>
              {["all", ...MODULES].map((m) => (
                <button
                  key={m}
                  onClick={() => setModFilter(m)}
                  className={`flex items-center gap-2 px-2.5 py-2 text-xs tracking-wide rounded-sm transition-all text-left border-l-2 ${
                    modFilter === m
                      ? "border-current"
                      : "border-transparent text-[#444466] hover:text-[#8888aa]"
                  }`}
                  style={{
                    color:
                      modFilter === m
                        ? (MODULE_COLORS[m] ?? "#00f5d4")
                        : undefined,
                  }}
                >
                  {modFilter === m && m !== "all" && (
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: MODULE_COLORS[m] }}
                    />
                  )}
                  {m === "all" ? "ALL" : m.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Contract list */}
            <div className="flex-1 overflow-visible md:overflow-y-auto p-4 sm:p-5 min-w-0">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <span className="text-[#1a1a2e] text-4xl">◻</span>
                  <p className="text-[#444466] text-xs tracking-widest">
                    NO CONTRACTS MATCH FILTER
                  </p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="text-[#00f5d4] text-xs tracking-widest hover:glow-teal transition-all"
                  >
                    + DEPLOY NEW CONTRACT
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {filtered.map((c) => (
                      <motion.div
                        key={c.id}
                        layout
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.18 }}
                      >
                        <ContractCard
                          contract={c}
                          onComplete={handleComplete}
                          onDelete={remove}
                          onEdit={setEditTarget}
                          onHandlerEvent={onHandlerEvent}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
