import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";

const BOOT_LINES = [
  { text: "UPLINK OS v2.7.1 — CRYPTIX SYSTEMS", delay: 0, color: "teal" },
  { text: "Initializing kernel modules...", delay: 300, color: "dim" },
  {
    text: "Loading neural interface drivers... [OK]",
    delay: 700,
    color: "dim",
  },
  {
    text: "Mounting encrypted contract ledger... [OK]",
    delay: 1100,
    color: "dim",
  },
  { text: "Calibrating Rep engine... [OK]", delay: 1500, color: "dim" },
  {
    text: "Verifying Clearance Tier registry... [OK]",
    delay: 1900,
    color: "dim",
  },
  { text: "Scanning for active Bounties...", delay: 2300, color: "amber" },
  {
    text: "WARNING: 2 unresolved Bounties detected on node.",
    delay: 2600,
    color: "red",
  },
  {
    text: "Uptime daemon online. Synergy core: STANDBY",
    delay: 3000,
    color: "dim",
  },
  { text: "Black Market feed: CONNECTED", delay: 3300, color: "dim" },
  {
    text: "────────────────────────────────────────────",
    delay: 3600,
    color: "border",
  },
  { text: "IDENTIFY YOURSELF, FIXER.", delay: 3900, color: "magenta" },
];

interface BootScreenProps {
  onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [progress, setProgress] = useState(0);

  const skipBoot = () => {
    setVisibleLines(BOOT_LINES.map((_, i) => i));
    setProgress(100);
    setShowAuth(true);
  };

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    BOOT_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
        setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100));
        if (i === BOOT_LINES.length - 1) {
          setTimeout(() => setShowAuth(true), 500);
        }
      }, line.delay);
      timers.push(t);
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (showAuth) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") skipBoot();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showAuth]);

  const colorClass: Record<string, string> = {
    teal: "text-[#00f5d4] glow-teal font-bold",
    magenta: "text-[#f700ff] glow-magenta font-bold",
    amber: "text-[#ffd166] glow-amber font-semibold",
    red: "text-[#ff5475] glow-red font-bold",
    dim: "text-[#b8c4d8] font-semibold",
    border: "text-[#71809b] font-semibold",
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "transparent" }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff2d55] opacity-80" />
            <span className="w-3 h-3 rounded-full bg-[#ffb800] opacity-80" />
            <span className="w-3 h-3 rounded-full bg-[#39ff14] opacity-80" />
          </div>
          <span className="text-[#aab6ca] text-xs font-mono font-semibold tracking-widest">
            UPLINK_OS — TERMINAL v2.7.1
          </span>
        </div>

        {/* Terminal window */}
        <div
          className="border border-[#00f5d4]/20 rounded-sm overflow-hidden box-glow-teal"
          role="region"
          aria-label="UPLINK operating system boot sequence"
          style={{
            background: "rgba(10,10,22,0.82)",
            backdropFilter: "blur(18px)",
          }}
        >
          {/* Progress bar */}
          <div className="h-px bg-[#1a1a2e] relative overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#00f5d4]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Boot lines */}
          <div
            className="p-6 font-mono text-sm leading-7 min-h-[320px]"
            aria-live="polite"
            aria-label="Boot status"
          >
            {BOOT_LINES.map((line, i) => (
              <AnimatePresence key={i}>
                {visibleLines.includes(i) && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`${colorClass[line.color]} tracking-wide`}
                  >
                    <span className="text-[#71809b] mr-2 select-none">›</span>
                    {line.text}
                    {i === visibleLines[visibleLines.length - 1] &&
                      !showAuth && (
                        <span className="animate-blink text-[#00f5d4] ml-1">
                          █
                        </span>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Auth form */}
          <AnimatePresence>
            {showAuth && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="border-t border-[#1a1a2e] p-6"
              >
                <AuthForm onLogin={onComplete} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[#9aa8c0] text-xs font-semibold tracking-widest">
            CRYPTIX SYSTEMS — ALL CONTRACTS LOGGED.
          </p>
          {!showAuth && (
            <button
              onClick={skipBoot}
              type="button"
              aria-label="Skip boot sequence and open authentication"
              className="text-[#aab6ca] text-xs font-bold tracking-widest hover:text-[#d5e1f2] transition-colors"
            >
              SKIP →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthForm({ onLogin }: { onLogin: () => void }) {
  const { login, signup, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [localError, setLocalError] = useState("");

  const displayError = localError || error;

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    setLocalError("");
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (mode === "login") {
      if (!email.trim() || !pass) {
        setLocalError("ERR: Email and passkey required.");
        return;
      }
      try {
        await login(email.trim(), pass);
        onLogin();
      } catch {
        // error already set in context
      }
    } else {
      if (!handle.trim()) {
        setLocalError("ERR: Handle required.");
        return;
      }
      if (!email.trim()) {
        setLocalError("ERR: Email required.");
        return;
      }
      if (!pass) {
        setLocalError("ERR: Passkey required.");
        return;
      }
      try {
        await signup(handle.trim(), email.trim(), pass);
        onLogin();
      } catch {
        // error already set in context
      }
    }
  };

  const inputRow = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { type?: string; placeholder?: string; autoComplete?: string }
  ) => (
    <div className="flex items-center gap-3">
      <label
        className="text-[#aab6ca] text-xs font-semibold w-20 shrink-0 select-none"
        htmlFor={`auth-${label.toLowerCase()}`}
      >
        {label}:
      </label>
      <div className="flex-1 flex items-center bg-[#080810] px-3 py-2.5 gap-2 border border-[#252540] focus-within:border-[#00f5d4] transition-colors duration-150">
        <span className="text-[#00f5d4] text-xs select-none leading-none">
          ›_
        </span>
        <input
          id={`auth-${label.toLowerCase()}`}
          type={opts?.type ?? "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={opts?.placeholder ?? ""}
          autoComplete={opts?.autoComplete}
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent text-[#e8e8f0] text-sm outline-none placeholder-[#333355] caret-[#00f5d4]"
          style={{ fontFamily: "var(--font-mono)", color: "#e8e8f0" }}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Mode tabs */}
      <div className="flex gap-4 mb-1">
        {(["login", "signup"] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            aria-pressed={mode === m}
            className={`text-xs tracking-widest uppercase pb-1 border-b transition-all ${
              mode === m
                ? "text-[#00f5d4] border-[#00f5d4]"
                : "text-[#aab6ca] border-transparent hover:text-[#e8f1ff] hover:border-[#71809b]"
            }`}
          >
            {m === "login" ? "[ AUTHENTICATE ]" : "[ REGISTER FIXER ]"}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div className="space-y-2.5">
        {mode === "signup" &&
          inputRow("HANDLE", handle, setHandle, {
            placeholder: "ghost_v",
            autoComplete: "username",
          })}
        {inputRow("EMAIL", email, setEmail, {
          type: "email",
          placeholder: "fixer@uplink.net",
          autoComplete: "email",
        })}
        {inputRow("PASSKEY", pass, setPass, {
          type: "password",
          placeholder: "••••••••",
          autoComplete: mode === "login" ? "current-password" : "new-password",
        })}
      </div>

      {/* Error */}
      {displayError && (
        <motion.p
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[#ff2d55] text-xs tracking-wide glow-red"
        >
          {displayError}
        </motion.p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#00f5d4] text-[#080810] font-bold text-sm tracking-widest uppercase hover:bg-[#00c4aa] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-[#080810] border-t-transparent rounded-full animate-spin" />
            AUTHENTICATING...
          </span>
        ) : mode === "login" ? (
          "JACK IN →"
        ) : (
          "REGISTER AS FIXER →"
        )}
      </button>

      {/* Demo shortcut */}
      <div className="flex items-center justify-between">
        <p className="text-[#c4d0e2] text-xs font-bold tracking-wide">
          Unauthorized access is a capital offense.
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="text-[#d6e2f2] text-xs font-bold hover:text-[#ffffff] transition-colors tracking-widest"
        >
          [DEMO MODE]
        </button>
      </div>
    </form>
  );
}
