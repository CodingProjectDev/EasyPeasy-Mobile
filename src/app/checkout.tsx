import { Ionicons } from '@expo/vector-icons';
import {
  ImageManipulator,
  SaveFormat,
} from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';
import { useCart } from '@/context/cart-context';
import {
  calculateCheckoutTotals,
  money,
} from '@/lib/checkout';
import {
  placeOrder,
  sendOrderConfirmation,
  uploadPaymentProof,
} from '@/lib/store-api';
import { supabase } from '@/lib/supabase';
import type {
  PaymentMethod,
  PromoCode,
  StoreSettings,
} from '@/types/order';
import { Product, productFromRow } from '@/types/product';

const defaultSettings: StoreSettings = {
  storeName: 'EasyPeasy-Thrift',
  tagline: 'Secondhand. Standout. So Easy.',
  announcementText: '',
  storeEmail: '',
  storePhone: '',
  shippingInfo: 'Depends on product and location',
  codEnabled: true,
  qrEnabled: true,
  qrImage: '/store-qr.png',
  returnPolicy:
    'Please review the store shipping and return policy before ordering.',
};

type ProofFile = {
  uri: string;
  name: string;
  type: string;
};

function resolveStoreImage(path?: string) {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base =
    process.env.EXPO_PUBLIC_STORE_API_URL?.replace(
      /\/+$/,
      '',
    ) || '';

  return base
    ? `${base}${path.startsWith('/') ? path : `/${path}`}`
    : '';
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?:
    | 'default'
    | 'email-address'
    | 'phone-pad'
    | 'number-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.readonly]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        editable={editable}
      />
    </View>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  danger = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={[styles.summaryRow, strong && styles.totalRow]}>
      <Text style={[styles.summaryLabel, strong && styles.totalText]}>
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          strong && styles.totalText,
          danger && styles.discount,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{ productId?: string }>();
  const { items, clearCart } = useCart();
  const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] =
    useState<StoreSettings>(defaultSettings);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [method, setMethod] = useState<PaymentMethod>('COD');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [promoText, setPromoText] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [proof, setProof] = useState<ProofFile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace({
          pathname: '/login',
          params: { next: '/checkout' },
        });
        return;
      }

      if (!mounted) {
        return;
      }

      setEmail(session.user.email || '');
      setName(
        String(
          session.user.user_metadata?.name ||
            session.user.user_metadata?.full_name ||
            '',
        ),
      );

      if (params.productId) {
        const { data: buyNowRow, error: buyNowError } = await supabase
          .from('products')
          .select('*')
          .eq('id', params.productId)
          .eq('active', true)
          .maybeSingle();

        if (buyNowError || !buyNowRow || Number(buyNowRow.inventory) < 1) {
          Alert.alert('Product unavailable', 'This item can no longer be purchased.');
          router.replace('/(tabs)/shop');
          return;
        }

        setBuyNowProduct(productFromRow(buyNowRow));
      }

      const [settingsResult, promosResult, profileResult] =
        await Promise.all([
          supabase
            .from('store_settings')
            .select(
              'cod_enabled,qr_enabled,qr_image_path,return_policy',
            )
            .eq('id', 1)
            .maybeSingle(),
          supabase
            .from('promo_codes')
            .select(
              'id,code,discount_type,value,expires_at,active',
            )
            .eq('active', true)
            .gte('expires_at', new Date().toISOString()),
          supabase
            .from('profiles')
            .select('full_name,phone')
            .eq('id', session.user.id)
            .maybeSingle(),
        ]);

      if (!mounted) {
        return;
      }

      if (settingsResult.data) {
        const row = settingsResult.data;
          const nextSettings: StoreSettings = {
          storeName: defaultSettings.storeName,
          tagline: defaultSettings.tagline,
          announcementText: defaultSettings.announcementText,
          storeEmail: defaultSettings.storeEmail,
          storePhone: defaultSettings.storePhone,
          shippingInfo: defaultSettings.shippingInfo,
          codEnabled:
            typeof row.cod_enabled === 'boolean'
              ? row.cod_enabled
              : true,
          qrEnabled:
            typeof row.qr_enabled === 'boolean'
              ? row.qr_enabled
              : true,
          qrImage: row.qr_image_path
            ? String(row.qr_image_path)
            : defaultSettings.qrImage,
          returnPolicy: String(
            row.return_policy || defaultSettings.returnPolicy,
          ),
        };

        setSettings(nextSettings);

        if (!nextSettings.codEnabled && nextSettings.qrEnabled) {
          setMethod('QR');
        }
      }

      setPromos(
        (promosResult.data || []).map((row) => ({
          id: String(row.id),
          code: String(row.code),
          type: String(row.discount_type) as PromoCode['type'],
          value: Number(row.value),
          expiresAt: String(row.expires_at),
          active: Boolean(row.active),
        })),
      );

      if (profileResult.data) {
        setName((current) =>
          current || String(profileResult.data?.full_name || ''),
        );
        setPhone(String(profileResult.data.phone || ''));
      }

      setLoading(false);
    }

    void boot();

    return () => {
      mounted = false;
    };
  }, [params.productId]);

  const checkoutItems = useMemo(
    () =>
      buyNowProduct
        ? [{ product: buyNowProduct, quantity: 1 }]
        : items,
    [buyNowProduct, items],
  );

  const validPromo = useMemo(
    () =>
      promos.find(
        (promo) =>
          promo.code.toLowerCase() ===
            promoText.trim().toLowerCase() &&
          promo.active &&
          new Date(promo.expiresAt) >= new Date(),
      ),
    [promoText, promos],
  );

  const totals = useMemo(
    () => calculateCheckoutTotals(checkoutItems, validPromo),
    [checkoutItems, validPromo],
  );

  const shippingLabel = totals.shippingPending
    ? totals.shipping > 0
      ? `${money(totals.shipping)} + location fee`
      : 'Depends on location'
    : totals.shipping > 0
      ? money(totals.shipping)
      : 'FREE';

  async function chooseProof() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access required',
          'Allow photo access to select your payment screenshot.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const context = ImageManipulator.manipulate(asset.uri);
      const largestSide = Math.max(asset.width, asset.height);

      if (largestSide > 1800) {
        if (asset.width >= asset.height) {
          context.resize({ width: 1800, height: null });
        } else {
          context.resize({ width: null, height: 1800 });
        }
      }

      const rendered = await context.renderAsync();
      const converted = await rendered.saveAsync({
        compress: 0.82,
        format: SaveFormat.JPEG,
      });

      setProof({
        uri: converted.uri,
        name: `payment-proof-${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
    } catch (error) {
      Alert.alert(
        'Could not select image',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }

  async function submit() {
    const customer = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
    };

    if (Object.values(customer).some((value) => !value)) {
      Alert.alert(
        'Delivery details required',
        'Complete every delivery field before ordering.',
      );
      return;
    }

    if (!checkoutItems.length) {
      Alert.alert('Your bag is empty');
      return;
    }

    if (promoText.trim() && !validPromo) {
      Alert.alert('Invalid promo code', 'Remove it or enter a valid code.');
      return;
    }

    if (method === 'QR' && (!proof || !transactionId.trim())) {
      Alert.alert(
        'QR payment details required',
        'Upload your payment screenshot and enter the transaction ID.',
      );
      return;
    }

    setBusy(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        router.replace({
          pathname: '/login',
          params: { next: '/checkout' },
        });
        return;
      }

      let paymentProofPath = '';

      if (method === 'QR' && proof) {
        paymentProofPath = await uploadPaymentProof(
          proof,
          session.access_token,
        );
      }

      const result = await placeOrder(
        {
          customer,
          items: checkoutItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          paymentMethod: method,
          transactionId:
            method === 'QR' ? transactionId.trim() : undefined,
          paymentProofPath:
            method === 'QR' ? paymentProofPath : undefined,
          promoCode: validPromo?.code || null,
        },
        session.access_token,
      );

      const savedTotals = result.order || totals;

      let emailSent = true;
      try {
        await sendOrderConfirmation(result.orderId, session.access_token);
      } catch (emailError) {
        emailSent = false;
        console.error('MOBILE CONFIRMATION EMAIL ERROR:', emailError);
      }

      if (!buyNowProduct) {
        clearCart();
      }

      router.replace({
        pathname: '/order-confirmation',
        params: {
          orderId: result.orderId,
          method,
          total: String(savedTotals.total),
          shipping: String(savedTotals.shipping),
          shippingPending: savedTotals.shippingPending
            ? 'true'
            : 'false',
          emailSent: emailSent ? 'true' : 'false',
        },
      });
    } catch (error) {
      Alert.alert(
        'Order not placed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.green} size="large" />
          <Text style={styles.loadingText}>Preparing checkout…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!checkoutItems.length && !params.productId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={46} color={colors.green} />
          <Text style={styles.emptyTitle}>Your bag is empty</Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/shop')}
          >
            <Text style={styles.primaryText}>Back to shop</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Checkout</Text>
            <Text style={styles.headerSubtitle}>Almost yours</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery details</Text>
            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              autoCapitalize="words"
            />
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
            <Field
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />
            <Field
              label="Street address"
              value={address}
              onChangeText={setAddress}
              placeholder="Delivery address"
            />
            <View style={styles.fieldRow}>
              <View style={styles.flex}>
                <Field
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.flex}>
                <Field
                  label="Postal code"
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="Postal code"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment method</Text>

            {settings.codEnabled && (
              <Pressable
                style={[
                  styles.paymentCard,
                  method === 'COD' && styles.paymentCardActive,
                ]}
                onPress={() => setMethod('COD')}
              >
                <Ionicons name="car-outline" size={25} color={colors.green} />
                <View style={styles.flex}>
                  <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                  <Text style={styles.paymentText}>Pay when your order arrives.</Text>
                </View>
                <Ionicons
                  name={method === 'COD' ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={colors.green}
                />
              </Pressable>
            )}

            {settings.qrEnabled && (
              <Pressable
                style={[
                  styles.paymentCard,
                  method === 'QR' && styles.paymentCardActive,
                ]}
                onPress={() => setMethod('QR')}
              >
                <Ionicons name="qr-code-outline" size={25} color={colors.green} />
                <View style={styles.flex}>
                  <Text style={styles.paymentTitle}>QR Payment</Text>
                  <Text style={styles.paymentText}>Pay now and upload proof.</Text>
                </View>
                <Ionicons
                  name={method === 'QR' ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={colors.green}
                />
              </Pressable>
            )}

            {!settings.codEnabled && !settings.qrEnabled && (
              <Text style={styles.warning}>
                Checkout is temporarily unavailable because all payment methods are disabled.
              </Text>
            )}

            {method === 'QR' && settings.qrEnabled && (
              <View style={styles.qrPanel}>
                {resolveStoreImage(settings.qrImage) ? (
                  <Image
                    source={{ uri: resolveStoreImage(settings.qrImage) }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                ) : null}

                <Text style={styles.qrTitle}>Scan and complete payment</Text>
                <Text style={styles.qrText}>
                  {totals.shippingPending
                    ? 'Pay the current total. The location-based shipping charge will be confirmed separately and paid on delivery.'
                    : 'Pay the full total, then upload a clear screenshot.'}
                </Text>

                <Pressable style={styles.proofButton} onPress={() => void chooseProof()}>
                  <Ionicons name="image-outline" size={21} color={colors.green} />
                  <Text style={styles.proofButtonText}>
                    {proof ? 'Change payment screenshot' : 'Select payment screenshot'}
                  </Text>
                </Pressable>

                {proof && (
                  <Image source={{ uri: proof.uri }} style={styles.proofPreview} />
                )}

                <Field
                  label="Transaction / Reference ID"
                  value={transactionId}
                  onChangeText={setTransactionId}
                  placeholder="e.g. TXN123456789"
                  autoCapitalize="none"
                />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your order</Text>

            {checkoutItems.map((item) => (
              <SummaryRow
                key={item.product.id}
                label={`${item.product.name} × ${item.quantity}`}
                value={money(item.product.price * item.quantity)}
              />
            ))}

            <View style={styles.divider} />

            <Field
              label="Promo code"
              value={promoText}
              onChangeText={setPromoText}
              placeholder="EASY10"
              autoCapitalize="none"
            />

            {promoText ? (
              <Text style={validPromo ? styles.promoGood : styles.promoBad}>
                {validPromo
                  ? `Applied: ${validPromo.code}`
                  : 'Code is not valid'}
              </Text>
            ) : null}

            <SummaryRow label="Subtotal" value={money(totals.subtotal)} />
            <SummaryRow label="Shipping" value={shippingLabel} />
            {totals.discount > 0 && (
              <SummaryRow
                label="Promo discount"
                value={`−${money(totals.discount)}`}
                danger
              />
            )}
            <SummaryRow
              label={totals.shippingPending ? 'Current total' : 'Order total'}
              value={money(totals.total)}
              strong
            />

            {totals.shippingPending && (
              <Text style={styles.shippingNotice}>
                Location-based shipping is not included. It will be confirmed separately and paid on delivery.
              </Text>
            )}

            <Pressable
              style={[
                styles.primaryButton,
                (busy || (!settings.codEnabled && !settings.qrEnabled)) &&
                  styles.disabled,
              ]}
              disabled={
                busy || (!settings.codEnabled && !settings.qrEnabled)
              }
              onPress={() => void submit()}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryText}>
                    {method === 'QR'
                      ? 'Submit payment for verification'
                      : 'Place COD order'}
                  </Text>
                  <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
                </>
              )}
            </Pressable>

            <Text style={styles.policy}>{settings.returnPolicy}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: colors.background,
  },
  headerCopy: { flex: 1 },
  headerTitle: { color: colors.text, fontSize: 21, fontWeight: '900' },
  headerSubtitle: { marginTop: 2, color: colors.muted, fontSize: 12 },
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
  scroll: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    padding: 18,
    paddingBottom: 42,
    gap: 16,
  },
  section: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 15,
  },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  field: { gap: 7 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 51,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
  },
  readonly: { backgroundColor: colors.softGreen, color: colors.muted },
  paymentCard: {
    minHeight: 72,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentCardActive: {
    borderColor: colors.green,
    backgroundColor: colors.softGreen,
  },
  paymentTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  paymentText: { marginTop: 3, color: colors.muted, fontSize: 12 },
  qrPanel: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.background,
    gap: 13,
  },
  qrImage: { width: 210, height: 210, alignSelf: 'center' },
  qrTitle: { textAlign: 'center', color: colors.text, fontWeight: '900' },
  qrText: { textAlign: 'center', color: colors.muted, lineHeight: 19 },
  proofButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  proofButtonText: { color: colors.green, fontWeight: '900' },
  proofPreview: { width: '100%', height: 220, borderRadius: 14, resizeMode: 'contain' },
  summaryRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  summaryLabel: { flex: 1, color: colors.muted, lineHeight: 20 },
  summaryValue: { color: colors.text, fontWeight: '800', textAlign: 'right' },
  totalRow: { paddingTop: 13, borderTopWidth: 1, borderTopColor: colors.line },
  totalText: { color: colors.text, fontSize: 18, fontWeight: '900' },
  discount: { color: colors.danger },
  divider: { height: 1, backgroundColor: colors.line },
  promoGood: { color: colors.green, fontWeight: '800' },
  promoBad: { color: colors.danger, fontWeight: '800' },
  shippingNotice: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFF6DF',
    color: '#73510B',
    lineHeight: 19,
  },
  warning: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FCEAE6',
    color: colors.danger,
    lineHeight: 19,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 17,
    paddingHorizontal: 18,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.5 },
  policy: { textAlign: 'center', color: colors.muted, fontSize: 11, lineHeight: 17 },
  center: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: { color: colors.muted },
  emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
});
