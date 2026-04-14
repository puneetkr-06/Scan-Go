import { lineAfterOffer, pickActiveOffer, round2 } from './offers'

const DEFAULT_GST = 5

/**
 * @param {Array<{ product: object, qty: number }>} lines
 * @param {number} gstPercent
 */
export function cartTotals(lines, gstPercent = DEFAULT_GST) {
  let mrpSubtotal = 0
  let afterOffers = 0

  for (const { product, qty } of lines) {
    const offer = pickActiveOffer(product.offers)
    const mrpLine = round2(Number(product.price) * qty)
    mrpSubtotal += mrpLine
    afterOffers += lineAfterOffer(Number(product.price), qty, offer)
  }

  const discountTotal = round2(mrpSubtotal - afterOffers)
  const gstAmount = round2(afterOffers * (gstPercent / 100))
  const total = round2(afterOffers + gstAmount)

  return {
    mrpSubtotal,
    discountTotal,
    afterOffers,
    gstPercent,
    gstAmount,
    total,
  }
}

export { DEFAULT_GST }
