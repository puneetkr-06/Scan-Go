import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { supabase } from '../lib/supabase'

function OrderCard({ order, expanded, onToggle }) {
  const date = new Date(order.created_at)
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const lines = order.receipt?.lines || []
  const savings = Number(order.receipt?.discount_total || 0)

  return (
    <li className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-stone-50 transition"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f4ec]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              stroke="#3d9a1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-extrabold text-stone-900">₹{Number(order.total).toFixed(2)}</p>
            <span className="rounded-full bg-[#f0f4ec] px-2 py-0.5 text-[10px] font-bold text-[#3d9a1f]">
              Paid
            </span>
          </div>
          <p className="mt-0.5 text-xs text-stone-500">{dateStr} · {timeStr}</p>
          <p className="mt-0.5 text-xs text-stone-400 font-mono">{order.id.slice(0, 8)}…</p>
          {savings > 0 && (
            <p className="mt-1 text-xs font-semibold text-[#3d9a1f]">Saved ₹{savings.toFixed(2)}</p>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className={`shrink-0 mt-1 text-stone-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {expanded && lines.length > 0 && (
        <div className="border-t border-stone-100 px-4 pb-4 pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">Items</p>
          <ul className="space-y-2">
            {lines.map((line, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[10px] font-black text-stone-500">
                    {line.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate text-stone-700">{line.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs text-stone-400">×{line.qty}</span>
                  <span className="ml-2 font-bold text-stone-900">₹{Number(line.line_payable).toFixed(2)}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-stone-100 pt-3 flex justify-between text-sm">
            <span className="text-stone-500">Total paid</span>
            <span className="font-extrabold text-stone-900">₹{Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      )}
    </li>
  )
}

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    if (!supabase) { setErr('Supabase not configured'); setLoading(false); return }
    let ignore = false
    ;(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total, receipt, created_at')
        .order('created_at', { ascending: false })
        .limit(50)
      if (ignore) return
      if (error) setErr(error.message)
      else setOrders(data || [])
      setLoading(false)
    })()
    return () => { ignore = true }
  }, [])

  const totalSpent = orders.reduce((s, o) => s + Number(o.total), 0)
  const totalSaved = orders.reduce((s, o) => s + Number(o.receipt?.discount_total || 0), 0)

  return (
    <Layout title="Orders">
      <div className="space-y-4">
        {/* Summary strip */}
        {orders.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Orders', value: orders.length },
              { label: 'Total spent', value: `₹${totalSpent.toFixed(0)}` },
              { label: 'Total saved', value: `₹${totalSaved.toFixed(0)}` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-white border border-stone-100 px-3 py-3 text-center shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
                <p className="mt-1 text-base font-extrabold text-stone-900">{value}</p>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#3d9a1f] border-t-transparent"/>
          </div>
        )}

        {err && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
        )}

        {!loading && !err && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-100">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"
                  stroke="#d4d0c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-lg font-bold text-stone-700">No orders yet</p>
            <p className="mt-2 text-sm text-stone-500">Complete a purchase to see your history here.</p>
          </div>
        )}

        {orders.length > 0 && (
          <ul className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}
