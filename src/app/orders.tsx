import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useFocusEffect,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';
import { money } from '@/lib/checkout';
import { supabase } from '@/lib/supabase';
import { sendOrderConfirmation } from '@/lib/store-api';
import type {
  CustomerOrder,
  OrderStatus,
  PaymentMethod,
} from '@/types/order';

const orderSelect = `
  id,
  public_order_id,
  customer_id,
  email,
  full_name,
  phone,
  address,
  city,
  postal_code,
  subtotal,
  shipping,
  shipping_pending,
  discount,
  total,
  payment_method,
  transaction_id,
  status,
  created_at,
  order_items (
    id,
    product_id,
    product_name,
    unit_price,
    quantity
  )
`;

const legacyOrderSelect = orderSelect.replace(
  'shipping_pending,',
  '',
);

function numberValue(value: unknown) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function statusTone(status: OrderStatus) {
  if (status === 'Payment Rejected') {
    return styles.statusBad;
  }

  if (
    status === 'Pending' ||
    status === 'Payment Verification Required'
  ) {
    return styles.statusWarn;
  }

  return styles.statusGood;
}

function statusMessage(status: OrderStatus) {
  switch (status) {
    case 'Payment Verification Required':
      return 'Your QR payment is waiting for admin verification.';
    case 'Payment Rejected':
      return 'The payment was rejected. Contact the store before trying again.';
    case 'Approved':
      return 'Payment approved. Your order will move to processing.';
    case 'Processing':
      return 'Your order is being prepared.';
    case 'Shipped':
      return 'Your order has been shipped.';
    case 'Delivered':
      return 'Your order has been delivered.';
    default:
      return 'Your order is pending store review.';
  }
}

function mapOrder(row: any): CustomerOrder {
  return {
    databaseId: String(row.id),
    id: String(row.public_order_id),
    createdAt: String(row.created_at),
    customer: {
      name: String(row.full_name || ''),
      email: String(row.email || ''),
      phone: String(row.phone || ''),
      address: String(row.address || ''),
      city: String(row.city || ''),
      postalCode: String(row.postal_code || ''),
    },
    items: Array.isArray(row.order_items)
      ? row.order_items.map((item: any) => ({
          productId: item.product_id
            ? String(item.product_id)
            : String(item.id),
          name: String(item.product_name || ''),
          price: numberValue(item.unit_price),
          quantity: numberValue(item.quantity),
        }))
      : [],
    subtotal: numberValue(row.subtotal),
    shipping: numberValue(row.shipping),
    shippingPending: Boolean(row.shipping_pending),
    discount: numberValue(row.discount),
    total: numberValue(row.total),
    paymentMethod: String(row.payment_method) as PaymentMethod,
    transactionId: row.transaction_id
      ? String(row.transaction_id)
      : undefined,
    status: String(row.status) as OrderStatus,
  };
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [emailingOrderId, setEmailingOrderId] = useState('');

  const emailConfirmation = useCallback(async (orderId: string) => {
    setEmailingOrderId(orderId);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        router.replace({ pathname: '/login', params: { next: '/orders' } });
        return;
      }
      const result = await sendOrderConfirmation(orderId, data.session.access_token);
      Alert.alert(
        result.alreadySent ? 'Email already sent' : 'Confirmation sent',
        result.alreadySent
          ? 'This order already has a confirmation email.'
          : 'Check your inbox and spam folder.',
      );
    } catch (emailError) {
      Alert.alert(
        'Email not sent',
        emailError instanceof Error ? emailError.message : 'Please try again.',
      );
    } finally {
      setEmailingOrderId('');
    }
  }, []);

  const loadOrders = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace({
          pathname: '/login',
          params: { next: '/orders' },
        });
        return;
      }

      let result: {
        data: any[] | null;
        error: { message: string } | null;
      } = await supabase
        .from('orders')
        .select(orderSelect)
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (
        result.error &&
        result.error.message.includes('shipping_pending')
      ) {
        result = await supabase
          .from('orders')
          .select(legacyOrderSelect)
          .eq('customer_id', session.user.id)
          .order('created_at', { ascending: false });
      }

      if (result.error) {
        throw result.error;
      }

      setOrders((result.data || []).map(mapOrder));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Could not load orders.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadOrders();
    }, [loadOrders]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>My orders</Text>
          <Text style={styles.headerSubtitle}>Status and order history</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.green} size="large" />
          <Text style={styles.muted}>Loading your orders…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadOrders(true)}
              tintColor={colors.green}
            />
          }
        >
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void loadOrders()}>
                <Text style={styles.retry}>Try again</Text>
              </Pressable>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={46} color={colors.green} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.muted}>Your placed orders will appear here.</Text>
              <Pressable
                style={styles.shopButton}
                onPress={() => router.replace('/(tabs)/shop')}
              >
                <Text style={styles.shopText}>Start shopping</Text>
              </Pressable>
            </View>
          ) : (
            orders.map((order) => (
              <View style={styles.card} key={order.databaseId}>
                <View style={styles.cardHead}>
                  <View style={styles.flex}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <Text style={styles.date}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.status, statusTone(order.status)]}>
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>

                <Text style={styles.statusMessage}>
                  {statusMessage(order.status)}
                </Text>

                <View style={styles.divider} />

                {order.items.map((item, index) => (
                  <View style={styles.row} key={`${item.productId}-${index}`}>
                    <Text style={styles.rowLabel}>
                      {item.name} × {item.quantity}
                    </Text>
                    <Text style={styles.rowValue}>
                      {money(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}

                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Subtotal</Text>
                  <Text style={styles.rowValue}>{money(order.subtotal)}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Shipping</Text>
                  <Text style={styles.rowValue}>
                    {order.shippingPending
                      ? order.shipping > 0
                        ? `${money(order.shipping)} + location fee`
                        : 'Location fee pending'
                      : order.shipping > 0
                        ? money(order.shipping)
                        : 'FREE'}
                  </Text>
                </View>

                {order.discount > 0 && (
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Promo discount</Text>
                    <Text style={styles.discount}>
                      −{money(order.discount)}
                    </Text>
                  </View>
                )}

                <View style={[styles.row, styles.totalRow]}>
                  <Text style={styles.totalText}>
                    {order.shippingPending ? 'Current total' : 'Total'} ·{' '}
                    {order.paymentMethod}
                  </Text>
                  <Text style={styles.totalText}>{money(order.total)}</Text>
                </View>

                {order.shippingPending && (
                  <Text style={styles.shippingNotice}>
                    Location-based shipping will be confirmed separately and paid on delivery.
                  </Text>
                )}

                {order.paymentMethod === 'QR' && (
                  <Text style={styles.transaction}>
                    Transaction ID: {order.transactionId || '—'}
                  </Text>
                )}

                <Pressable
                  style={styles.emailButton}
                  disabled={emailingOrderId === order.id}
                  onPress={() => void emailConfirmation(order.id)}
                >
                  {emailingOrderId === order.id ? (
                    <ActivityIndicator color={colors.green} />
                  ) : (
                    <Ionicons name="mail-outline" size={18} color={colors.green} />
                  )}
                  <Text style={styles.emailButtonText}>Send confirmation email</Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    minHeight: 66,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerTitle: { color: colors.text, fontSize: 21, fontWeight: '900' },
  headerSubtitle: { marginTop: 2, color: colors.muted, fontSize: 12 },
  scroll: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 42,
    gap: 15,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  muted: { color: colors.muted, textAlign: 'center' },
  empty: {
    minHeight: 360,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
  },
  emptyTitle: { color: colors.text, fontSize: 23, fontWeight: '900' },
  shopButton: {
    minHeight: 50,
    marginTop: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
  },
  shopText: { color: '#FFFFFF', fontWeight: '900' },
  errorBox: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#FCEAE6',
    gap: 10,
  },
  errorText: { color: colors.danger, lineHeight: 20 },
  retry: { color: colors.green, fontWeight: '900' },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  orderId: { color: colors.text, fontSize: 18, fontWeight: '900' },
  date: { marginTop: 3, color: colors.muted, fontSize: 12 },
  status: { maxWidth: '55%', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusGood: { backgroundColor: colors.softGreen },
  statusWarn: { backgroundColor: '#FFF1C9' },
  statusBad: { backgroundColor: '#FCEAE6' },
  statusText: { color: colors.text, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  statusMessage: { color: colors.muted, lineHeight: 19 },
  divider: { height: 1, backgroundColor: colors.line },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  rowLabel: { flex: 1, color: colors.muted, lineHeight: 20 },
  rowValue: { color: colors.text, fontWeight: '800', textAlign: 'right' },
  discount: { color: colors.danger, fontWeight: '800' },
  totalRow: { paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  totalText: { color: colors.text, fontSize: 16, fontWeight: '900' },
  shippingNotice: {
    padding: 11,
    borderRadius: 11,
    color: '#73510B',
    backgroundColor: '#FFF6DF',
    lineHeight: 18,
  },
  transaction: { color: colors.muted, fontSize: 12 },
  emailButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: colors.softGreen,
  },
  emailButtonText: { color: colors.darkGreen, fontWeight: '900' },
});
