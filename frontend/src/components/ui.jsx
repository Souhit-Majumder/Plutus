// ── Spinner ───────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin"
    />
  )
}

// ── LoadingOverlay ────────────────────────────────────────────────────────
export function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size={28} />
    </div>
  )
}

// ── Badge ────────────────────────────────────────────────────────────────
const BADGE_COLORS = [
  'bg-blue-50 text-blue-600',
  'bg-violet-50 text-violet-600',
  'bg-cyan-50 text-cyan-600',
  'bg-emerald-50 text-emerald-600',
  'bg-amber-50 text-amber-600',
  'bg-pink-50 text-pink-600',
]

export function Badge({ label, idx = 0 }) {
  const color = BADGE_COLORS[idx % BADGE_COLORS.length]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`}>
      {label}
    </span>
  )
}

// ── Alert / Error Box ─────────────────────────────────────────────────────
export function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm">
      {message}
    </div>
  )
}

// ── Confirm Delete Prompt ─────────────────────────────────────────────────
export function ConfirmRow({ onConfirm, onCancel, loading }) {
  return (
    <div className="flex items-center gap-2 mt-4">
      <button onClick={onConfirm} disabled={loading} className="btn-danger text-xs px-3 py-1.5">
        {loading ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">
        Cancel
      </button>
    </div>
  )
}
