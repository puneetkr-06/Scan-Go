import { isSupabaseConfigured } from '../lib/supabase'

export function EnvConfigWarning() {
  if (isSupabaseConfigured) return null

  return (
    <div className="mb-6 space-y-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <p>
        Supabase env vars are missing or still set to placeholders. Add real values for{' '}
        <code className="rounded bg-black/30 px-1">VITE_SUPABASE_URL</code> and{' '}
        <code className="rounded bg-black/30 px-1">VITE_SUPABASE_ANON_KEY</code>.
      </p>
      <ul className="list-inside list-disc space-y-1 text-amber-100/90">
        <li>
          Use <code className="rounded bg-black/30 px-1">.env</code> in <strong className="text-white">frontend/</strong> or repo root — not{' '}
          <code className="rounded bg-black/30 px-1">.env.example</code>. Restart <code className="rounded bg-black/30 px-1">npm run dev</code> after edits.
        </li>
      </ul>
    </div>
  )
}
