import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/product-card';
import { colors } from '@/constants/easypeasy-theme';
import { useCart } from '@/context/cart-context';
import { useCatalog } from '@/context/catalog-context';

export default function HomeScreen() {
  const { products, settings, ready, refreshing, refresh } = useCatalog();
  const { cartCount } = useCart();
  const categories = Array.from(
    new Map(products.filter((p) => p.category).map((p) => [p.category, p])).keys(),
  ).slice(0, 8);
  const newArrivals = products.filter((p) => p.newArrival).slice(0, 8);
  const featured = products.filter((p) => p.featured).slice(0, 8);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.green} />
        }
      >
        {!!settings.announcementText && (
          <Text style={styles.announcement}>{settings.announcementText}</Text>
        )}

        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.brand}>{settings.storeName}</Text>
            <Text style={styles.tagline}>{settings.tagline}</Text>
          </View>
          <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/shop')}>
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => router.push('/cart')}>
            <Ionicons name="bag-outline" size={22} color={colors.text} />
            {cartCount > 0 && <Text style={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</Text>}
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>CURATED · NEW & PRE-LOVED</Text>
          <Text style={styles.heroTitle}>Thoughtful finds. Timeless style.</Text>
          <Text style={styles.heroText}>
            Shop one-of-one pieces, discover new arrivals, and give your unused items a second life.
          </Text>
          <View style={styles.actions}>
            <Pressable style={styles.primary} onPress={() => router.push('/(tabs)/shop')}>
              <Text style={styles.primaryText}>Shop the drop</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => router.push('/(tabs)/sell')}>
              <Text style={styles.secondaryText}>Sell with us</Text>
            </Pressable>
          </View>
        </View>

        {!ready ? (
          <ActivityIndicator style={styles.loader} size="large" color={colors.green} />
        ) : (
          <>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Shop by category</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
              {categories.map((category) => (
                <Pressable
                  key={category}
                  style={styles.category}
                  onPress={() => router.push({ pathname: '/(tabs)/shop', params: { category } })}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name="pricetag-outline" size={22} color={colors.darkGreen} />
                  </View>
                  <Text style={styles.categoryText} numberOfLines={2}>{category}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <ProductRail title="New arrivals" products={newArrivals.length ? newArrivals : products.slice(0, 8)} />

            {!!featured.length && <ProductRail title="Featured finds" products={featured} />}

            {!products.length && (
              <View style={styles.empty}>
                <Ionicons name="leaf-outline" size={38} color={colors.green} />
                <Text style={styles.emptyTitle}>No products available</Text>
                <Text style={styles.muted}>Pull down to refresh the catalog.</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Fresh drops, vintage gems, zero spam.</Text>
          <Text style={styles.muted}>Questions about an item, shipping, or returns?</Text>
          <Pressable style={styles.secondary} onPress={() => router.push('/contact')}>
            <Text style={styles.secondaryText}>Contact EasyPeasy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductRail({ title, products }: { title: string; products: ReturnType<typeof useCatalog>['products'] }) {
  return (
    <View style={styles.railSection}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable onPress={() => router.push('/(tabs)/shop')}>
          <Text style={styles.viewAll}>View all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {products.map((product) => <ProductCard key={product.id} product={product} width={190} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  flex: { flex: 1 },
  announcement: { padding: 9, textAlign: 'center', color: '#FFFFFF', backgroundColor: colors.green, fontSize: 11, fontWeight: '800' },
  header: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.line },
  brand: { color: colors.darkGreen, fontSize: 20, fontWeight: '900' },
  tagline: { marginTop: 2, color: colors.muted, fontSize: 10 },
  iconButton: { position: 'relative', width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, textAlign: 'center', color: '#FFFFFF', backgroundColor: colors.green, fontSize: 9, fontWeight: '900', lineHeight: 19 },
  hero: { margin: 16, padding: 24, borderRadius: 28, backgroundColor: '#ECEBDD' },
  eyebrow: { color: colors.green, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  heroTitle: { marginTop: 10, color: colors.text, fontSize: 40, lineHeight: 43, fontWeight: '900' },
  heroText: { marginTop: 14, color: '#555A53', fontSize: 15, lineHeight: 23 },
  actions: { marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primary: { minHeight: 50, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: colors.green },
  primaryText: { color: '#FFFFFF', fontWeight: '900' },
  secondary: { minHeight: 48, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.green },
  secondaryText: { color: colors.darkGreen, fontWeight: '900' },
  loader: { marginVertical: 50 },
  sectionHead: { marginTop: 12, marginBottom: 13, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  viewAll: { color: colors.green, fontWeight: '900' },
  categories: { paddingHorizontal: 18, gap: 14 },
  category: { width: 82, alignItems: 'center' },
  categoryIcon: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  categoryText: { marginTop: 7, color: colors.text, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  railSection: { marginTop: 24 },
  rail: { paddingHorizontal: 18, gap: 12 },
  empty: { margin: 18, padding: 30, alignItems: 'center', borderRadius: 22, backgroundColor: colors.card },
  emptyTitle: { marginTop: 12, color: colors.text, fontSize: 19, fontWeight: '900' },
  muted: { marginTop: 7, color: colors.muted, lineHeight: 20 },
  infoCard: { margin: 18, marginTop: 36, padding: 24, alignItems: 'center', borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  infoTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
});
