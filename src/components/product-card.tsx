import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/easypeasy-theme';
import { useCatalog } from '@/context/catalog-context';
import { money } from '@/lib/checkout';
import type { Product } from '@/types/product';

export function ProductCard({
  product,
  width,
}: {
  product: Product;
  width?: number;
}) {
  const { isWishlisted, toggleWishlist } = useCatalog();
  const saved = isWishlisted(product.id);
  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round((1 - product.price / product.compareAt) * 100)
      : 0;

  return (
    <Pressable
      style={[styles.card, width ? { width } : undefined]}
      onPress={() =>
        router.push({ pathname: '/product/[id]', params: { id: product.id } })
      }
    >
      <View style={styles.imageWrap}>
        {product.images[0] ? (
          <Image source={{ uri: product.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={34} color={colors.muted} />
          </View>
        )}

        <Pressable
          hitSlop={8}
          style={styles.heart}
          onPress={(event) => {
            event.stopPropagation();
            toggleWishlist(product.id);
          }}
        >
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={19}
            color={saved ? colors.danger : colors.text}
          />
        </Pressable>

        <View style={[styles.badge, product.inventory < 1 && styles.soldBadge]}>
          <Text style={styles.badgeText}>
            {product.inventory < 1
              ? 'SOLD OUT'
              : product.newArrival
                ? 'NEW'
                : discount
                  ? `${discount}% OFF`
                  : product.oneOfOne
                    ? 'ONE-OF-ONE'
                    : product.condition.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        {!!product.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{money(product.price)}</Text>
          {!!product.compareAt && product.compareAt > product.price && (
            <Text style={styles.compare}>{money(product.compareAt)}</Text>
          )}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {product.freeShipping
            ? 'Free shipping'
            : product.shippingFee != null
              ? `Shipping ${money(product.shippingFee)}`
              : 'Shipping depends on location'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.card,
  },
  imageWrap: { position: 'relative', aspectRatio: 0.82, backgroundColor: '#EEECE5' },
  image: { width: '100%', height: '100%' },
  noImage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heart: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  badge: {
    position: 'absolute',
    left: 9,
    bottom: 9,
    borderRadius: 999,
    backgroundColor: colors.green,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  soldBadge: { backgroundColor: colors.text },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  body: { padding: 11 },
  brand: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  name: { marginTop: 3, minHeight: 38, color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  priceRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  price: { color: colors.darkGreen, fontSize: 14, fontWeight: '900' },
  compare: { color: colors.muted, fontSize: 11, textDecorationLine: 'line-through' },
  meta: { marginTop: 5, color: colors.muted, fontSize: 10 },
});
