import type { Product } from '@/types/product';

export type PaymentMethod = 'COD' | 'QR';

export type OrderStatus =
  | 'Pending'
  | 'Payment Verification Required'
  | 'Payment Rejected'
  | 'Approved'
  | 'Processing'
  | 'Shipped'
  | 'Delivered';

export type PromoCode = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expiresAt: string;
  active: boolean;
};

export type StoreSettings = {
  storeName: string;
  tagline: string;
  announcementText: string;
  storeEmail: string;
  storePhone: string;
  shippingInfo: string;
  codEnabled: boolean;
  qrEnabled: boolean;
  qrImage?: string;
  logoImage?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  pinterestUrl?: string;
  returnPolicy: string;
};

export type SellSubmission = {
  id: string;
  item_name: string;
  category: string;
  brand: string | null;
  size: string | null;
  condition: string;
  description: string;
  expected_price: number | null;
  images: string[];
  delivery_method: string | null;
  status: string;
  rejection_reason: string | null;
  approved_price: number | null;
  seller_percentage: number | null;
  seller_earning: number | null;
  store_earning: number | null;
  product_id: string | null;
  payout_status: string;
  payout_method: string | null;
  payout_reference: string | null;
  paid_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CheckoutLine = {
  product: Product;
  quantity: number;
};

export type CheckoutTotals = {
  subtotal: number;
  shipping: number;
  shippingPending: boolean;
  discount: number;
  total: number;
};

export type DeliveryCustomer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

export type PlaceOrderPayload = {
  customer: DeliveryCustomer;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentProofPath?: string;
  promoCode?: string | null;
};

export type PlaceOrderResult = {
  success: boolean;
  orderId: string;
  customerId: string;
  order?: CheckoutTotals & {
    paymentMethod: PaymentMethod;
    status: OrderStatus;
  };
};

export type CustomerOrder = CheckoutTotals & {
  databaseId: string;
  id: string;
  createdAt: string;
  customer: DeliveryCustomer;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  status: OrderStatus;
};
