// Place this file at: client/src/lib/handler.ts
//
// Client-side helper for The Handler. Calls the backend's /api/handler
// endpoint. Mirrors the same fallback lines as the backend so
// HandlerToast can correctly detect "isFallback" even in the rare case
// the fetch itself fails client-side (network drop, etc.) - the backend
// already has its own fallback safety net for Gemini failing, this is
// an extra layer for the fetch call itself failing.

export type HandlerEvent =
  | "contract_complete"
  | "contract_failed"
  | "bounty_cleared"
  | "contract_suggest"

export type HandlerContext = Record<string, unknown>

const FALLBACK_LINES: Record<HandlerEvent, string> = {
  contract_complete:
    "Contract closed. Clean work. The city won't remember, but I will.",
  contract_failed:
    "Contract's gone cold. Happens to the best fixers. Shake it off.",
  bounty_cleared: "Debt's clear. You're off the hook - for now.",
  contract_suggest: "Got a lead for you. Your call whether you take it.",
}

export function fallbackHandlerLine(event: HandlerEvent): string {
  return FALLBACK_LINES[event]
}

export async function requestHandlerLine(
  event: HandlerEvent,
  context: HandlerContext = {},
): Promise<string> {
  try {
    const response = await fetch("/api/handler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: event, context }),
    })

    if (!response.ok) {
      return fallbackHandlerLine(event)
    }

    const data = await response.json()
    return data?.line ?? fallbackHandlerLine(event)
  } catch {
    // Network failure, timeout, etc. - never let this break the UI.
    return fallbackHandlerLine(event)
  }
}
