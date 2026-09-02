import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { colors } from '@/constants/easypeasy-theme';
import { supabase } from '@/lib/supabase';
import {
  Product,
  productFromRow,
} from '@/types/product';

function money(value: number) {
  return `Rs. ${Math.round(value).toLocaleString()}`;
}

function getDiscountPercent(product: Product) {
  if (
    !product.compareAt ||
    product.compareAt <= product.price
  ) {
    return null;
  }

  return Math.round(
    (1 - product.price / product.compareAt) * 100,
  );
}

function ProductCard({
  product,
}: {
  product: Product;
}) {
  const image =
    product.images[0] || '';

  const discount =
    getDiscountPercent(product);

  return (
    <Pressable style={styles.card}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.noImage}>
            <Ionicons
              name="image-outline"
              size={34}
              color={colors.muted}
            />
          </View>
        )}

        <Pressable
          style={styles.heart}
          hitSlop={8}
        >
          <Ionicons
            name="heart-outline"
            size={19}
            color={colors.text}
          />
        </Pressable>

        {product.inventory < 1 ? (
          <View style={styles.soldBadge}>
            <Text style={styles.soldBadgeText}>
              SOLD OUT
            </Text>
          </View>
        ) : product.newArrival ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              NEW
            </Text>
          </View>
        ) : discount ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {discount}% OFF
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        {!!product.brand && (
          <Text
            style={styles.brand}
            numberOfLines={1}
          >
            {product.brand}
          </Text>
        )}

        <Text
          style={styles.name}
          numberOfLines={2}
        >
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {money(product.price)}
          </Text>

          {product.compareAt &&
            product.compareAt > product.price && (
              <Text style={styles.compareAt}>
                {money(product.compareAt)}
              </Text>
            )}
        </View>

        <Text style={styles.meta}>
          {product.freeShipping
            ? 'Free shipping'
            : product.shippingFee != null &&
                product.shippingFee > 0
              ? `Shipping ${money(product.shippingFee)}`
              : product.condition || product.category}
        </Text>
      </View>
    </Pressable>
  );
}

export default function ShopScreen() {
  const { width } =
    useWindowDimensions();

  const columns =
    width >= 1000
      ? 4
      : width >= 700
        ? 3
        : width >= 350
          ? 2
          : 1;

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState('All');

  const loadProducts =
    useCallback(async () => {
      setError('');

      const {
        data,
        error: loadError,
      } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', {
          ascending: false,
        });

      if (loadError) {
        console.error(
          'MOBILE PRODUCTS LOAD ERROR:',
          loadError,
        );

        setError(
          'Could not load products right now.',
        );

        setProducts([]);
        return;
      }

      setProducts(
        (data || []).map(productFromRow),
      );
    }, []);

  useEffect(() => {
    async function boot() {
      setLoading(true);
      await loadProducts();
      setLoading(false);
    }

    void boot();
  }, [loadProducts]);

  async function refresh() {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  }

  const categories =
    useMemo(() => {
      const values =
        Array.from(
          new Set(
            products
              .map((product) =>
                product.category.trim(),
              )
              .filter(Boolean),
          ),
        ).sort((a, b) =>
          a.localeCompare(b),
        );

      return ['All', ...values];
    }, [products]);

  const filteredProducts =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return products.filter(
        (product) => {
          const matchesCategory =
            selectedCategory === 'All' ||
            product.category ===
              selectedCategory;

          const matchesSearch =
            !query ||
            product.name
              .toLowerCase()
              .includes(query) ||
            product.brand
              .toLowerCase()
              .includes(query) ||
            product.category
              .toLowerCase()
              .includes(query);

          return (
            matchesCategory &&
            matchesSearch
          );
        },
      );
    }, [
      products,
      search,
      selectedCategory,
    ]);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        key={`shop-${columns}`}
        data={filteredProducts}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.column}>
            <ProductCard
              product={item}
            />
          </View>
        )}
        contentContainerStyle={styles.list}
        columnWrapperStyle={
          columns > 1
            ? styles.row
            : undefined
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.green}
          />
        }
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>
              THE RACK
            </Text>

            <Text style={styles.title}>
              Shop all finds.
            </Text>

            <Text style={styles.subtitle}>
              New, pre-loved and one-of-one pieces from EasyPeasy.
            </Text>

            <View style={styles.searchBox}>
              <Ionicons
                name="search-outline"
                size={20}
                color={colors.muted}
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search products, brands..."
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                autoCapitalize="none"
                returnKeyType="search"
              />

              {!!search && (
                <Pressable
                  onPress={() =>
                    setSearch('')
                  }
                  hitSlop={8}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              )}
            </View>

            <FlatList
              data={categories}
              horizontal
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => {
                const active =
                  item ===
                  selectedCategory;

                return (
                  <Pressable
                    style={[
                      styles.chip,
                      active &&
                        styles.chipActive,
                    ]}
                    onPress={() =>
                      setSelectedCategory(
                        item,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active &&
                          styles.chipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              }}
            />

            {!loading && !error && (
              <Text style={styles.count}>
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1
                  ? 'product'
                  : 'products'}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.state}>
              <ActivityIndicator
                size="large"
                color={colors.green}
              />

              <Text style={styles.stateTitle}>
                Loading the rack…
              </Text>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Ionicons
                name="cloud-offline-outline"
                size={42}
                color={colors.green}
              />

              <Text style={styles.stateTitle}>
                Couldn&apos;t load products
              </Text>

              <Text style={styles.stateText}>
                {error}
              </Text>

              <Pressable
                style={styles.retryButton}
                onPress={loadProducts}
              >
                <Text
                  style={styles.retryText}
                >
                  Try Again
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Ionicons
                name="bag-handle-outline"
                size={44}
                color={colors.green}
              />

              <Text style={styles.stateTitle}>
                No finds here yet
              </Text>

              <Text style={styles.stateText}>
                Try another category or search.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    list: {
      paddingHorizontal: 14,
      paddingTop: 18,
      paddingBottom: 32,
    },

    eyebrow: {
      paddingHorizontal: 4,
      color: colors.green,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.6,
    },

    title: {
      paddingHorizontal: 4,
      marginTop: 5,
      color: colors.text,
      fontSize: 38,
      lineHeight: 41,
      fontWeight: '800',
    },

    subtitle: {
      paddingHorizontal: 4,
      marginTop: 8,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
    },

    searchBox: {
      marginTop: 18,
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 15,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
    },

    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: 12,
    },

    chips: {
      paddingTop: 14,
      paddingBottom: 8,
      gap: 8,
    },

    chip: {
      minHeight: 36,
      justifyContent: 'center',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.card,
      paddingHorizontal: 15,
    },

    chipActive: {
      borderColor: colors.green,
      backgroundColor: colors.green,
    },

    chipText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '700',
    },

    chipTextActive: {
      color: '#FFFFFF',
    },

    count: {
      paddingHorizontal: 4,
      marginTop: 8,
      marginBottom: 12,
      color: colors.muted,
      fontSize: 12,
      fontWeight: '600',
    },

    row: {
      gap: 10,
    },

    column: {
      flex: 1,
      minWidth: 0,
    },

    card: {
      flex: 1,
      marginBottom: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 18,
      backgroundColor: colors.card,
    },

    imageWrap: {
      position: 'relative',
      aspectRatio: 0.82,
      backgroundColor: '#EEECE5',
    },

    image: {
      width: '100%',
      height: '100%',
    },

    noImage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    heart: {
      position: 'absolute',
      top: 9,
      right: 9,
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        'rgba(255,255,255,0.92)',
    },

    badge: {
      position: 'absolute',
      left: 9,
      bottom: 9,
      borderRadius: 999,
      backgroundColor:
        colors.green,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    badgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    soldBadge: {
      position: 'absolute',
      left: 9,
      bottom: 9,
      borderRadius: 999,
      backgroundColor:
        colors.text,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    soldBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    cardBody: {
      padding: 11,
    },

    brand: {
      color: colors.muted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },

    name: {
      marginTop: 3,
      minHeight: 38,
      color: colors.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '700',
    },

    priceRow: {
      marginTop: 7,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },

    price: {
      color: colors.darkGreen,
      fontSize: 14,
      fontWeight: '900',
    },

    compareAt: {
      color: colors.muted,
      fontSize: 11,
      textDecorationLine:
        'line-through',
    },

    meta: {
      marginTop: 5,
      color: colors.muted,
      fontSize: 10,
    },

    state: {
      minHeight: 360,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },

    stateTitle: {
      marginTop: 14,
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      textAlign: 'center',
    },

    stateText: {
      marginTop: 7,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },

    retryButton: {
      marginTop: 18,
      borderRadius: 12,
      backgroundColor:
        colors.green,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },

    retryText: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
  });
