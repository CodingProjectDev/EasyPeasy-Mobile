import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';
import { money } from '@/lib/checkout';

export default function OrderConfirmationScreen() {
  const params = useLocalSearchParams<{
    orderId?: string;
    method?: string;
    total?: string;
    shipping?: string;
    shippingPending?: string;
    emailSent?: string;
  }>();

  const orderId = params.orderId || 'Order';
  const total = Number(params.total || 0);
  const shipping = Number(params.shipping || 0);
  const shippingPending = params.shippingPending === 'true';
  const isQr = params.method === 'QR';
  const emailSent = params.emailSent !== 'false';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.page}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </View>

        <Text style={styles.eyebrow}>{orderId}</Text>
        <Text style={styles.title}>Order placed.</Text>
        <Text style={styles.message}>
          {isQr
            ? 'Your payment proof is waiting for admin verification.'
            : 'Your Cash on Delivery order is pending review.'}
        </Text>

        <View style={[styles.emailBox, !emailSent && styles.emailWarning]}>
          <Ionicons
            name={emailSent ? 'mail-outline' : 'alert-circle-outline'}
            size={20}
            color={emailSent ? colors.darkGreen : colors.danger}
          />
          <Text style={emailSent ? styles.emailText : styles.emailWarningText}>
            {emailSent
              ? 'A confirmation email was sent to your account email.'
              : 'Your order is safe, but the confirmation email could not be sent. Retry it from My Orders.'}
          </Text>
        </View>

        <View style={styles.summary}>
          <View style={styles.row}>
            <Text style={styles.label}>
              {shippingPending ? 'Current total' : 'Order total'}
            </Text>
            <Text style={styles.value}>{money(total)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Included shipping</Text>
            <Text style={styles.value}>
              {shipping > 0 ? money(shipping) : shippingPending ? 'Pending' : 'FREE'}
            </Text>
          </View>

          {shippingPending && (
            <Text style={styles.notice}>
              Location-based shipping will be confirmed separately and paid on delivery.
            </Text>
          )}
        </View>

        <Pressable style={styles.primary} onPress={() => router.replace('/orders')}>
          <Text style={styles.primaryText}>View my orders</Text>
        </Pressable>

        <Pressable
          style={styles.secondary}
          onPress={() => router.replace('/(tabs)/shop')}
        >
          <Text style={styles.secondaryText}>Keep shopping</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
  },
  eyebrow: {
    marginTop: 24,
    color: colors.green,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: { marginTop: 8, color: colors.text, fontSize: 38, fontWeight: '900' },
  message: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  summary: {
    width: '100%',
    marginTop: 28,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 13,
  },
  emailBox: {
    width: '100%',
    marginTop: 20,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 13,
    backgroundColor: colors.softGreen,
  },
  emailWarning: { backgroundColor: '#FCEAE6' },
  emailText: { flex: 1, color: colors.darkGreen, lineHeight: 19 },
  emailWarningText: { flex: 1, color: colors.danger, lineHeight: 19 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  label: { color: colors.muted },
  value: { color: colors.text, fontWeight: '900', textAlign: 'right' },
  notice: {
    padding: 12,
    borderRadius: 12,
    color: '#73510B',
    backgroundColor: '#FFF6DF',
    lineHeight: 19,
  },
  primary: {
    width: '100%',
    minHeight: 55,
    marginTop: 24,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  secondary: {
    width: '100%',
    minHeight: 53,
    marginTop: 11,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  secondaryText: { color: colors.text, fontWeight: '900' },
});
