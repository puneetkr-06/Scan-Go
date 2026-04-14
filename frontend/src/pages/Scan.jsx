import { useCallback, useRef, useState } from 'react'
import { fetchProductByBarcode } from '../api/products'
import { BarcodeScanner } from '../components/BarcodeScanner'
import { Layout } from '../components/Layout'
import { useCart } from '../contexts/CartContext'
import { useStore } from '../contexts/StoreContext'
import { lineAfterOffer, pickActiveOffer } from '../utils/offers'
import { useBudget } from '../contexts/BudgetContext'

function playSuccessSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()
    osc1.connect(gain); osc2.connect(gain); gain.connect(ctx.destination)
    osc1.type = 'sine'; osc2.type = 'sine'
    osc1.frequency.setValueAtTime(880, now)
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.12)
    osc2.frequency.setValueAtTime(1100, now + 0.08)
    osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.2)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    osc1.start(now); osc1.stop(now + 0.15)
    osc2.start(now + 0.08); osc2.stop(now + 0.28)
  } catch (_) {}
}

function StoreBanner({ store }) {
  if (!store) return null
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-stone-100">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ffd209] text-sm font-black text-stone-900">
        {store.name?.[0] ?? '?'}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Shopping at</p>
        <p className="font-extrabold text-stone-900 leading-tight truncate">{store.name}</p>
        {store.location && (
          <p className="text-xs text-stone-400 truncate">{store.location}</p>
        )}
      </div>
    </div>
  )
}

function OfferSuggestionBanner({ suggestion, onDismiss }) {
  if (!suggestion) return null
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#ffd209] to-[#f5c000] p-4 shadow-lg">
      <button type="button" onClick={onDismiss}
        className="absolute right-3 top-3 text-stone-600 hover:text-stone-900">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </button>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-900/10">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5l3.5-.5L8 2z" fill="#1a1a1a"/>
          </svg>
        </div>
        <div className="pr-4">
          <p className="font-extrabold text-stone-900 text-sm leading-tight">{suggestion.title}</p>
          <p className="mt-0.5 text-xs text-stone-700 leading-snug">{suggestion.desc}</p>
          {suggestion.stores && (
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestion.stores.map((s) => (
                <span key={s} className="rounded-full bg-stone-900/10 px-2 py-0.5 text-[10px] font-semibold text-stone-800">{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BudgetBar({ budget, spent }) {
  const pct = Math.min((spent / budget) * 100, 100)
  const remaining = Math.max(budget - spent, 0)
  const over = spent > budget
  return (
    <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Budget</span>
          {over && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">Over budget!</span>}
        </div>
        <span className={`text-xs font-bold ${over ? 'text-red-600' : 'text-stone-700'}`}>
          ₹{spent.toFixed(0)} / ₹{budget.toFixed(0)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
        <div className={`h-full rounded-full transition-all duration-500 ${over ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-[#3d9a1f]'}`}
          style={{ width: `${pct}%` }}/>
      </div>
      {!over && <p className="mt-1.5 text-xs text-stone-500">₹{remaining.toFixed(0)} remaining</p>}
    </div>
  )
}

export function ScanPage() {
  const { selectedStore } = useStore()
  const { addProduct, lines } = useCart()
  const { budget, budgetMode } = useBudget()
  const [toast, setToast] = useState(null)
  const [scanPaused, setScanPaused] = useState(false)
  const [offerSuggestion, setOfferSuggestion] = useState(null)
  const toastTimerRef = useRef(0)

  const spent = lines.reduce((sum, l) =>
    sum + lineAfterOffer(Number(l.product.price), l.qty, pickActiveOffer(l.product?.offers)), 0)

  const showToast = useCallback((t, ms = 3200) => {
    setToast(t)
    setScanPaused(true)
    window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      setScanPaused(false)
    }, ms)
  }, [])

  const onScan = useCallback(
    async (barcode) => {
      if (!selectedStore?.id) return
      const { data, error } = await fetchProductByBarcode(selectedStore.id, barcode)
      if (error) { showToast({ type: 'error', title: 'Network error', text: error.message }); return }
      if (!data) { showToast({ type: 'error', title: 'Product not found', text: `No match for barcode ${barcode}` }); return }

      const offer = pickActiveOffer(data.offers)
      const res = addProduct(data)
      if (!res.ok && res.reason === 'out_of_stock') { showToast({ type: 'error', title: 'Out of stock', text: data.name }); return }

      const unit = Number(data.price)
      const payable = lineAfterOffer(unit, 1, offer)

      if (budgetMode && budget > 0 && (spent + payable) > budget) {
        showToast({ type: 'warn', title: '⚠ Budget exceeded', text: `Adding ${data.name} will exceed your ₹${budget} budget` })
        return
      }

      playSuccessSound()

      if (data.offers?.length > 0) {
        const bestOffer = data.offers.find((o) => o.min_qty && o.min_qty > 1)
        if (bestOffer) {
          const currentQty = lines.find((l) => l.product.id === data.id)?.qty || 0
          const needed = bestOffer.min_qty - (currentQty + 1)
          if (needed > 0) {
            setOfferSuggestion({
              title: `Add ${needed} more to unlock a deal!`,
              desc: `Spend ₹${(unit * needed).toFixed(0)} more on ${data.name} to get ${
                bestOffer.type === 'percent' ? `${bestOffer.value}% off` :
                bestOffer.type === 'flat' ? `₹${bestOffer.value} off` : 'BOGO'
              }`,
              stores: selectedStore ? [selectedStore.name] : [],
            })
          }
        }
      }

      showToast({
        type: 'ok',
        title: data.name,
        text: offer ? `Offer applied · ₹${payable.toFixed(2)}` : `₹${unit.toFixed(2)} · Added to cart`,
      })
    },
    [selectedStore, addProduct, showToast, spent, budgetMode, budget, lines],
  )

  return (
    <Layout>
      <div className="space-y-3">
        {/* Store name displayed inline, above the scanner */}
        <StoreBanner store={selectedStore} />

        <p className="text-center text-sm text-stone-500">
          Point the camera at a product barcode. Duplicate scans increase quantity.
        </p>

        {budgetMode && budget > 0 && <BudgetBar budget={budget} spent={spent}/>}

        <BarcodeScanner onScan={onScan} paused={scanPaused}/>

        {offerSuggestion && (
          <OfferSuggestionBanner suggestion={offerSuggestion} onDismiss={() => setOfferSuggestion(null)}/>
        )}

        <div className="rounded-2xl border border-dashed border-stone-200 bg-white/80 p-4 text-center text-sm text-stone-500">
          <p className="font-semibold text-stone-700">Demo barcodes (seed data)</p>
          <p className="mt-1 font-mono text-xs">8901030865398 · 8901491100288 · 8901030693619</p>
        </div>
      </div>

      {toast && (
        <div className="fixed inset-x-4 bottom-24 z-[100] mx-auto max-w-lg motion-safe:animate-[fadeSlide_0.35s_ease-out]" role="status">
          <div className={`rounded-2xl px-4 py-4 shadow-xl ${
            toast.type === 'error' ? 'bg-red-600 text-white' :
            toast.type === 'warn'  ? 'bg-amber-500 text-white' :
            'bg-[#1a1a1a] text-white ring-2 ring-[#7ed321]/50'
          }`}>
            <p className="font-bold">{toast.title}</p>
            <p className="mt-1 text-sm opacity-90">{toast.text}</p>
          </div>
        </div>
      )}
    </Layout>
  )
}
