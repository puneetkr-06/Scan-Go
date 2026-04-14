import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useCart, useCartLineOffer } from '../contexts/CartContext'
import { useStore } from '../contexts/StoreContext'
import { useBudget } from '../contexts/BudgetContext'
import { cartTotals } from '../utils/pricing'
import { lineAfterOffer, round2, pickActiveOffer } from '../utils/offers'

function OfferNudge({ lines, selectedStore }) {
  // Find items with quantity-based offers not yet activated
  const nudges = []
  for (const line of lines) {
    if (!line.product.offers) continue
    for (const offer of line.product.offers) {
      if (!offer.active) continue
      if (offer.min_qty && offer.min_qty > line.qty) {
        const needed = offer.min_qty - line.qty
        const extraSpend = Number(line.product.price) * needed
        nudges.push({
          id: line.product.id,
          name: line.product.name,
          needed,
          extraSpend,
          reward:
            offer.type === 'percent'
              ? `${offer.value}% off`
              : offer.type === 'flat'
              ? `₹${offer.value} off`
              : 'Buy 1 Get 1',
          store: selectedStore?.name,
        })
      }
    }
  }

  if (nudges.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Unlock deals</p>
      {nudges.map((n) => (
        <div
          key={n.id}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#ffd209]/20 to-[#ffd209]/5 border border-[#ffd209]/30 px-4 py-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ffd209]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5l3.5-.5L8 2z" fill="#1a1a1a" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{n.name}</p>
            <p className="text-xs text-stone-600">
              Add {n.needed} more (₹{n.extraSpend.toFixed(0)}) → get <span className="font-bold text-[#3d9a1f]">{n.reward}</span>
              {n.store && <span className="text-stone-400"> · {n.store}</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function BudgetWarning({ total, budget, budgetMode }) {
  if (!budgetMode || !budget) return null
  const over = total > budget
  const pct = Math.min((total / budget) * 100, 100)
  if (!over) return null

  return (
    <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 6v4M8 11.5v.5" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M6.5 2.5L1 13.5h14L9.5 2.5a1.7 1.7 0 00-3 0z" stroke="#dc2626" strokeWidth="1.4" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-bold text-red-700">Over budget by ₹{(total - budget).toFixed(2)}</p>
        <p className="text-xs text-red-500">Remove some items to stay within ₹{budget}</p>
      </div>
    </div>
  )
}

function CartLineRow({ line }) {
  const { setQty, removeLine, dismissPriceAlert, priceAlertIds } = useCart()
  const offer = useCartLineOffer(line)
  const mrpLine = round2(Number(line.product.price) * line.qty)
  const payLine = lineAfterOffer(Number(line.product.price), line.qty, offer)
  const priceChanged = priceAlertIds.includes(line.product.id)

  return (
    <li className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f0f4ec] to-[#e8f0e0] text-xs font-black text-[#3d9a1f] shadow-inner">
          {line.product.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-stone-900 leading-tight">{line.product.name}</p>
          <p className="mt-0.5 text-xs text-stone-400">Barcode {line.product.barcode}</p>
          {offer && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-lg bg-[#ffd209] px-2 py-0.5 text-[10px] font-bold uppercase text-stone-900">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 1l.9 1.9 2.1.3-1.5 1.5.35 2.1L4.5 5.9 2.65 6.8 3 4.7 1.5 3.2l2.1-.3L4.5 1z" fill="#1a1a1a" />
              </svg>
              {offer.type === 'percent' && `${offer.value}% off`}
              {offer.type === 'flat' && `₹${offer.value} off`}
              {offer.type === 'bogo' && 'BOGO'}
            </span>
          )}
          {priceChanged && (
            <button
              type="button"
              onClick={() => dismissPriceAlert(line.product.id)}
              className="mt-2 block w-full rounded-lg bg-amber-100 px-2 py-1.5 text-left text-xs font-semibold text-amber-900 hover:bg-amber-200 transition"
            >
              Price updated in-store — totals refreshed. Tap to dismiss.
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-stone-100 pt-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-stone-200 font-bold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition"
            onClick={() => setQty(line.product.id, line.qty - 1)}
          >
            −
          </button>
          <span className="w-8 text-center font-bold text-stone-900">{line.qty}</span>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-stone-200 font-bold text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition"
            onClick={() => setQty(line.product.id, line.qty + 1)}
          >
            +
          </button>
        </div>
        <div className="text-right">
          {mrpLine !== payLine && (
            <p className="text-xs text-stone-400 line-through">₹{mrpLine.toFixed(2)}</p>
          )}
          <p className="font-extrabold text-[#3d9a1f] text-base">₹{payLine.toFixed(2)}</p>
        </div>
        <button
          type="button"
          onClick={() => removeLine(line.product.id)}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 hover:text-red-700 transition"
        >
          Remove
        </button>
      </div>
    </li>
  )
}

export function CartPage() {
  const { lines } = useCart()
  const { selectedStore } = useStore()
  const { budget, budgetMode } = useBudget()
  const totals = cartTotals(lines)

  return (
    <Layout title="Your cart">
      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-stone-100">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M9 9h22.5l-2.25 13.5H11.25L9 9zm0 0L7.5 4.5H3M13.5 30a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm12 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="#d4d0c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-lg font-bold text-stone-700">Cart is empty</p>
          <p className="mt-2 text-sm text-stone-500">Scan items to add them here.</p>
          <Link
            to="/scan"
            className="mt-6 rounded-xl bg-[#3d9a1f] px-6 py-3 font-bold text-white shadow-md hover:bg-[#35891b] transition"
          >
            Start scanning
          </Link>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          <BudgetWarning total={totals.total} budget={budget} budgetMode={budgetMode} />

          <OfferNudge lines={lines} selectedStore={selectedStore} />

          <ul className="space-y-3">
            {lines.map((line) => (
              <CartLineRow key={line.product.id} line={line} />
            ))}
          </ul>

          <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-stone-100">
            {totals.discountTotal > 0 && (
              <div className="mb-4 rounded-xl bg-[#f0f9e8] px-4 py-2.5 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5l3.5-.5L8 2z" fill="#3d9a1f" />
                </svg>
                <p className="text-sm font-bold text-[#3d9a1f]">
                  You save ₹{totals.discountTotal.toFixed(2)} on this trip!
                </p>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>MRP subtotal</span>
                <span>₹{totals.mrpSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#3d9a1f]">
                <span>Offers &amp; deals</span>
                <span>− ₹{totals.discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>After offers</span>
                <span>₹{totals.afterOffers.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>GST ({totals.gstPercent}%)</span>
                <span>₹{totals.gstAmount.toFixed(2)}</span>
              </div>

              {budgetMode && budget > 0 && (
                <div className="flex justify-between text-stone-500 border-t border-stone-100 pt-2">
                  <span>Budget remaining</span>
                  <span className={totals.total > budget ? 'font-bold text-red-500' : 'font-bold text-[#3d9a1f]'}>
                    ₹{Math.max(budget - totals.total, 0).toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-stone-100 pt-3 text-lg font-extrabold text-stone-900">
                <span>Total</span>
                <span>₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
            <Link
              to="/payment"
              state={{ fromCart: true }}
              className="mt-4 block w-full rounded-xl bg-[#3d9a1f] py-3.5 text-center font-bold text-white shadow-md hover:bg-[#35891b] transition active:scale-[0.99]"
            >
              Proceed to pay
            </Link>
          </div>
        </div>
      )}
    </Layout>
  )
}
