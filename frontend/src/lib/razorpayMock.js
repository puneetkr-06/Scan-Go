/**
 * Mock Razorpay Checkout — same shape as window.Razorpay for easy swap later.
 * @param {{ amountPaise: number, orderLabel: string, onSuccess: (paymentId: string) => void, onFailure: (err: Error) => void }} opts
 */
export function openMockRazorpay(opts) {
  const success =
    import.meta.env.VITE_RAZORPAY_MOCK_SUCCESS !== 'false' &&
    import.meta.env.VITE_RAZORPAY_MOCK_SUCCESS !== '0'

  const overlay = document.createElement('div')
  overlay.className =
    'fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/50 p-4'
  overlay.innerHTML = `
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-stone-100">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-xs font-semibold uppercase tracking-wider text-[#0d9488]">Razorpay</span>
        <span class="text-xs text-stone-400">(mock)</span>
      </div>
      <h2 class="text-lg font-bold text-stone-900">${opts.orderLabel}</h2>
      <p class="mt-2 text-2xl font-extrabold text-stone-900">₹${(opts.amountPaise / 100).toFixed(2)}</p>
      <p class="mt-2 text-sm text-stone-500">Test mode — no real charge.</p>
      <div class="mt-6 flex gap-3">
        <button type="button" data-act="fail" class="flex-1 rounded-xl border-2 border-stone-200 py-3 font-semibold text-stone-700 hover:bg-stone-50">Fail</button>
        <button type="button" data-act="pay" class="flex-1 rounded-xl bg-[#0d9488] py-3 font-semibold text-white hover:bg-[#0f766e]">Pay now</button>
      </div>
    </div>
  `

  const cleanup = () => overlay.remove()

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cleanup()
      opts.onFailure?.(new Error('Payment dismissed'))
    }
  })

  overlay.querySelector('[data-act="pay"]')?.addEventListener('click', () => {
    cleanup()
    if (success) {
      opts.onSuccess?.(`mock_pay_${Date.now()}`)
    } else {
      opts.onFailure?.(new Error('Payment declined (mock)'))
    }
  })

  overlay.querySelector('[data-act="fail"]')?.addEventListener('click', () => {
    cleanup()
    opts.onFailure?.(new Error('Payment cancelled'))
  })

  document.body.appendChild(overlay)
}
