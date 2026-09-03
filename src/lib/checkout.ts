import type {
  CheckoutLine,
  CheckoutTotals,
  PromoCode,
} from '@/types/order';

export function calculateCheckoutTotals(
  lines: CheckoutLine[],
  promo?: PromoCode,
): CheckoutTotals {
  const subtotal = lines.reduce(
    (sum, line) =>
      sum + line.product.price * line.quantity,
    0,
  );

  const shipping = lines.reduce((sum, line) => {
    if (
      line.product.freeShipping ||
      line.product.shippingFee == null
    ) {
      return sum;
    }

    return (
      sum + line.product.shippingFee * line.quantity
    );
  }, 0);

  const shippingPending = lines.some(
    (line) =>
      !line.product.freeShipping &&
      line.product.shippingFee == null,
  );

  const discount = promo
    ? promo.type === 'percentage'
      ? (subtotal * promo.value) / 100
      : Math.min(subtotal, promo.value)
    : 0;

  return {
    subtotal,
    shipping,
    shippingPending,
    discount,
    total: Math.max(0, subtotal - discount) + shipping,
  };
}

export function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString()}`;
}
