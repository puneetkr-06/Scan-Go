import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { openMockRazorpay } from '../lib/razorpayMock'
import { supabase } from '../lib/supabase'
import { useCart } from '../contexts/CartContext'
import { useStore } from '../contexts/StoreContext'
import { DEFAULT_GST } from '../utils/pricing'
import payment_qr from '../assets/payment_qr.jpeg'



const UPI_QR_IMAGE = payment_qr
const UPI_ID = 'kumar620060@fam'


function QRPaySection({ total, onConfirm, busy }) {
  const [confirmed, setConfirmed] = useState(false)
  const [qrFailed, setQrFailed] = useState(false)

  async function handleConfirm() {
    setConfirmed(true)
    await onConfirm()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm border border-stone-100 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Scan &amp; Pay</p>
        <div className="mx-auto w-fit rounded-2xl border-4 border-[#ffd209] p-2 shadow-md bg-white">
          {qrFailed ? (
            <div className="h-48 w-48 rounded-xl bg-stone-100 items-center justify-center flex-col gap-2 text-stone-400 flex">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <rect x="8" y="8" width="10" height="10" fill="currentColor" rx="1"/>
                <rect x="26" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <rect x="30" y="8" width="10" height="10" fill="currentColor" rx="1"/>
                <rect x="4" y="26" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <rect x="8" y="30" width="10" height="10" fill="currentColor" rx="1"/>
                <rect x="26" y="26" width="4" height="4" fill="currentColor" rx="0.5"/>
                <rect x="34" y="26" width="4" height="4" fill="currentColor" rx="0.5"/>
                <rect x="40" y="26" width="4" height="4" fill="currentColor" rx="0.5"/>
                <rect x="26" y="34" width="4" height="4" fill="currentColor" rx="0.5"/>
                <rect x="34" y="34" width="10" height="10" fill="currentColor" rx="0.5"/>
              </svg>
              <p className="text-xs font-semibold text-center px-4">
                QR image failed to load.
                <br />
                <span className="text-[10px]">Check src/assets/payment_qr.jpeg</span>
              </p>
            </div>
          ) : (
            <img
              src={UPI_QR_IMAGE}
              alt="UPI QR Code"
              className="h-48 w-48 object-contain rounded-xl"
              onError={() => setQrFailed(true)}
            />
          )}
        </div>
        <p className="mt-3 text-sm font-bold text-stone-900">{UPI_ID}</p>
        <p className="mt-1 text-2xl font-extrabold text-[#3d9a1f]">₹{Number(total).toFixed(2)}</p>
        <p className="mt-1 text-xs text-stone-500">Pay exactly this amount via any UPI app</p>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        <p className="font-bold">After paying via UPI</p>
        <p className="mt-0.5 text-xs">Tap "I've paid" below. Show your payment confirmation + this screen at the exit.</p>
      </div>

      <button
        type="button"
        disabled={busy || confirmed}
        onClick={handleConfirm}
        className="w-full rounded-xl bg-[#3d9a1f] py-3.5 font-bold text-white shadow-md hover:bg-[#35891b] disabled:opacity-50 transition"
      >
        {busy ? 'Processing…' : confirmed ? 'Confirming…' : "I've paid — confirm order"}
      </button>
    </div>
  )
}

export function PaymentPage() {
  const { lines, clearCart } = useCart()
  const { selectedStore } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [summary, setSummary] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [payMethod, setPayMethod] = useState('qr') // 'qr' | 'razorpay'
  const orderIdRef = useRef(null)
  const paidRef = useRef(false)

  const cancelReservation = useCallback(async () => {
    const id = orderIdRef.current
    if (!id || paidRef.current || !supabase) return
    orderIdRef.current = null
    await supabase.rpc('cancel_awaiting_order', { p_order_id: id }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!location.state?.fromCart || lines.length === 0) {
      navigate('/cart', { replace: true })
      return undefined
    }
    let ignore = false
    async function reserve() {
      if (!supabase) { setErr('Supabase not configured'); return }
      const items = lines.map((l) => ({ product_id: l.product.id, qty: l.qty }))
      const { data, error: e } = await supabase.rpc('reserve_checkout', {
        p_store_id: selectedStore.id,
        p_items: items,
        p_gst_percent: DEFAULT_GST,
      })
      if (ignore) {
        if (data?.order_id) await supabase.rpc('cancel_awaiting_order', { p_order_id: data.order_id })
        return
      }
      if (e) { setErr(e.message); return }
      orderIdRef.current = data.order_id
      setSummary(data)
    }
    reserve()
    return () => {
      ignore = true
      const id = orderIdRef.current
      if (!id || paidRef.current || !supabase) return
      orderIdRef.current = null
      supabase.rpc('cancel_awaiting_order', { p_order_id: id }).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function completeOrder() {
    if (!summary?.order_id || !supabase) return
    setBusy(true)
    try {
      const { data, error: e } = await supabase.rpc('complete_checkout', { p_order_id: summary.order_id })
      if (e) throw e
      paidRef.current = true
      orderIdRef.current = null
      clearCart()
      navigate('/order-success', {
        replace: true,
        state: { orderId: summary.order_id, exitToken: data.exit_token, total: summary.total },
      })
    } catch (ex) {
      setErr(ex.message || 'Could not complete order')
    } finally {
      setBusy(false)
    }
  }

  function payWithRazorpay() {
    if (!summary?.order_id || !supabase) return
    const amountPaise = Math.round(Number(summary.total) * 100)
    setBusy(true)
    openMockRazorpay({
      amountPaise,
      orderLabel: `Order ${summary.order_id.slice(0, 8)}…`,
      onSuccess: async () => {
        await completeOrder()
      },
      onFailure: async () => {
        setErr('Payment failed — stock has been restored.')
        setBusy(false)
        await cancelReservation()
        navigate('/cart', { replace: true })
      },
    })
  }

  return (
    <Layout title="Payment" showNav={false}>
      <div className="space-y-4">
        <p className="text-sm text-stone-500">
          Stock is held while you pay. If you leave or payment fails, we release it automatically.
        </p>

        {err && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
            <Link to="/cart" className="mt-2 block font-bold text-red-900 underline">Back to cart</Link>
          </div>
        )}

        {!summary && !err && (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#3d9a1f] border-t-transparent"/>
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            {/* Order summary */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
              <h2 className="text-base font-extrabold text-stone-900 mb-3">Order summary</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <dt>MRP subtotal</dt><dd>₹{Number(summary.subtotal).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between font-semibold text-[#3d9a1f]">
                  <dt>Discounts</dt><dd>− ₹{Number(summary.discount_total).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>After offers</dt><dd>₹{Number(summary.after_offers).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-stone-600">
                  <dt>GST ({DEFAULT_GST}%)</dt><dd>₹{Number(summary.gst_amount).toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-stone-100 pt-3 text-xl font-extrabold text-stone-900">
                  <dt>Total</dt><dd>₹{Number(summary.total).toFixed(2)}</dd>
                </div>
              </dl>
            </div>

            {/* Payment method toggle */}
            <div className="flex rounded-2xl bg-stone-100 p-1 gap-1">
              {[
                { id: 'qr', label: 'UPI / QR Code' },
                { id: 'razorpay', label: 'Razorpay (mock)' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPayMethod(id)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                    payMethod === id
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Payment panel */}
            {payMethod === 'qr' ? (
              <QRPaySection
                total={summary.total}
                onConfirm={completeOrder}
                busy={busy}
              />
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={payWithRazorpay}
                  className="w-full rounded-xl bg-[#0d9488] py-3.5 font-bold text-white shadow-md hover:bg-[#0f766e] disabled:opacity-50 transition"
                >
                  {busy ? 'Processing…' : 'Pay with Razorpay (mock)'}
                </button>
              </div>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                await cancelReservation()
                navigate('/cart', { replace: true })
              }}
              className="w-full text-sm font-semibold text-stone-500 hover:text-stone-800 transition py-2"
            >
              Cancel and release stock
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
