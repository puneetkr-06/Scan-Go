import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useBudget } from '../contexts/BudgetContext'
import { useState } from 'react'

const nav = [
  { to: '/scan',    label: 'Scan',    icon: ScanIcon },
  { to: '/cart',    label: 'Cart',    icon: CartIcon },
  { to: '/orders',  label: 'Orders',  icon: OrdersIcon },
  { to: '/stores',  label: 'Store',   icon: StoreIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
]

function BudgetModal({ onClose }) {
  const { budget, setBudget, budgetMode, setBudgetMode } = useBudget()
  const [draft, setDraft] = useState(String(budget))

  function save() {
    const v = parseFloat(draft)
    if (!isNaN(v) && v > 0) setBudget(v)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-stone-900">Budget Mode</h2>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3.5">
            <div>
              <p className="font-bold text-stone-900">Enable Budget Mode</p>
              <p className="mt-0.5 text-xs text-stone-500">Warns you before adding items that exceed your limit</p>
            </div>
            <button type="button" onClick={() => setBudgetMode((v) => !v)}
              className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${budgetMode ? 'bg-[#3d9a1f]' : 'bg-stone-300'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${budgetMode ? 'translate-x-6' : 'translate-x-1'}`}/>
            </button>
          </div>
          {budgetMode && (
            <div>
              <label className="block text-sm font-semibold text-stone-600">Budget limit (₹)</label>
              <div className="mt-2">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-stone-400">₹</span>
                  <input type="number" min="1" value={draft} onChange={(e) => setDraft(e.target.value)}
                    className="w-full rounded-xl border-2 border-stone-200 py-3 pl-8 pr-4 font-bold text-stone-900 outline-none focus:border-[#3d9a1f]"
                    placeholder="500"/>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[200, 500, 1000, 2000].map((v) => (
                  <button key={v} type="button" onClick={() => setDraft(String(v))}
                    className={`rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition ${
                      Number(draft) === v ? 'border-[#3d9a1f] bg-[#3d9a1f] text-white' : 'border-stone-200 bg-white text-stone-700 hover:border-[#3d9a1f]/50'
                    }`}>₹{v}</button>
                ))}
              </div>
            </div>
          )}
          <button type="button" onClick={save}
            className="w-full rounded-xl bg-[#3d9a1f] py-3.5 font-bold text-white shadow-md hover:bg-[#35891b]">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export function Layout({ children, title, showNav = true }) {
  const location = useLocation()
  const { lines } = useCart()
  const { budgetMode } = useBudget()
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const [showBudget, setShowBudget] = useState(false)
  const isScanPage = location.pathname === '/scan'

  return (
    <div className="min-h-dvh flex flex-col bg-[#f6f7f5] text-stone-900 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1a1a1a] text-white shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <Link to="/scan" className="text-lg font-extrabold tracking-tight">
            <span className="text-[#7ed321]">Scan</span>
            <span className="text-white">&amp;Go</span>
          </Link>
          <div className="flex items-center gap-2">
            {/* Hide page title on scan page — store name shown inline on the page itself */}
            {title && !isScanPage && (
              <span className="text-sm font-medium text-stone-300">{title}</span>
            )}
            <button type="button" onClick={() => setShowBudget(true)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition ${
                budgetMode
                  ? 'border-[#7ed321]/40 bg-[#7ed321]/15 text-[#7ed321]'
                  : 'border-white/10 bg-white/5 text-stone-400 hover:text-white'
              }`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="3" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M4 3V2.5a2 2 0 114 0V3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="6" cy="6.5" r="1" fill="currentColor"/>
              </svg>
              {budgetMode ? 'Budget On' : 'Budget'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-4">{children}</main>

      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e8ebe4] bg-white/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md">
          <div className="mx-auto flex max-w-lg justify-around">
            {nav.map((item) => {
              const { to, label, icon: NavIcon } = item
              const active = location.pathname === to
              const isCart = to === '/cart'
              return (
                <Link key={to} to={to}
                  className={`relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
                    active ? 'text-[#3d9a1f]' : 'text-stone-400 hover:text-stone-600'
                  }`}>
                  {active && (
                    <span className="absolute -top-2 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#3d9a1f]"/>
                  )}
                  <span className="relative">
                    <NavIcon active={active}/>
                    {isCart && count > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ffd209] px-1 text-[10px] font-bold text-stone-900">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </span>
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}

      {showBudget && <BudgetModal onClose={() => setShowBudget(false)}/>}
    </div>
  )
}

function ScanIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-[#3d9a1f]' : 'text-current'}>
      <path d="M4 6V4h4M4 10v2M4 16v2M4 20h4M10 4h2M16 4h4M20 10v2M20 16v2M20 20h-4M10 20h2M16 20h-4M8 8h8v8H8V8z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function CartIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-[#3d9a1f]' : 'text-current'}>
      <path d="M6 6h15l-1.5 9h-12L6 6zm0 0L5 3H2M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function OrdersIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-[#3d9a1f]' : 'text-current'}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function StoreIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-[#3d9a1f]' : 'text-current'}>
      <path d="M4 10l2-6h12l2 6M4 10v10h16V10M4 10h16M9 14h6"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={active ? 'text-[#3d9a1f]' : 'text-current'}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
