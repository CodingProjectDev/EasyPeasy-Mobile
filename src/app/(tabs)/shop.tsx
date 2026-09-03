import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/product-card';
import { colors } from '@/constants/easypeasy-theme';
import { useCart } from '@/context/cart-context';
import { useCatalog } from '@/context/catalog-context';

type Sort = 'newest' | 'price-low' | 'price-high' | 'name';

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export default function ShopScreen() {
  const params = useLocalSearchParams<{ category?: string; sort?: string }>();
  const { width } = useWindowDimensions();
  const { products, ready, refreshing, error, refresh } = useCatalog();
  const { cartCount } = useCart();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(params.category || 'All');
  const [brand, setBrand] = useState('All');
  const [size, setSize] = useState('All');
  const [condition, setCondition] = useState('All');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState<Sort>(
    params.sort === 'price-low' || params.sort === 'price-high' || params.sort === 'name'
      ? params.sort
      : 'newest',
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const columns = width >= 1000 ? 4 : width >= 700 ? 3 : width >= 350 ? 2 : 1;

  const categories = useMemo(() => ['All', ...unique(products.map((p) => p.category))], [products]);
  const brands = useMemo(() => ['All', ...unique(products.map((p) => p.brand))], [products]);
  const sizes = useMemo(() => ['All', ...unique(products.map((p) => p.size))], [products]);
  const conditions = useMemo(() => ['All', ...unique(products.map((p) => p.condition))], [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const priceLimit = maxPrice.trim() ? Number(maxPrice) : Infinity;
    const list = products.filter((product) => {
      const searchable = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (category === 'All' || product.category === category) &&
        (brand === 'All' || product.brand === brand) &&
        (size === 'All' || product.size === size) &&
        (condition === 'All' || product.condition === condition) &&
        product.price <= (Number.isFinite(priceLimit) ? priceLimit : Infinity)
      );
    });
    return list.sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'name') return a.name.localeCompare(b.name);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [products, search, category, brand, size, condition, maxPrice, sort]);

  const activeFilters = [brand, size, condition].filter((v) => v !== 'All').length +
    (category !== 'All' ? 1 : 0) + (maxPrice ? 1 : 0);

  function clearFilters() {
    setCategory('All');
    setBrand('All');
    setSize('All');
    setCondition('All');
    setMaxPrice('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        key={`shop-${columns}`}
        data={filtered}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <View style={styles.column}><ProductCard product={item} /></View>}
        columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.green} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View style={styles.heading}>
              <View style={styles.flex}>
                <Text style={styles.eyebrow}>THE RACK</Text>
                <Text style={styles.title}>Shop all finds.</Text>
              </View>
              <Pressable style={styles.cartButton} onPress={() => router.push('/cart')}>
                <Ionicons name="bag-outline" size={22} color={colors.text} />
                {cartCount > 0 && <Text style={styles.badge}>{cartCount > 99 ? '99+' : cartCount}</Text>}
              </Pressable>
            </View>
            <Text style={styles.subtitle}>Search and filter every new, pre-loved, and one-of-one piece.</Text>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={20} color={colors.muted} />
                <TextInput value={search} onChangeText={setSearch} placeholder="Products, brands, categories…" placeholderTextColor={colors.muted} style={styles.searchInput} />
                {!!search && <Pressable onPress={() => setSearch('')}><Ionicons name="close-circle" size={20} color={colors.muted} /></Pressable>}
              </View>
              <Pressable style={styles.filterButton} onPress={() => setFiltersOpen(true)}>
                <Ionicons name="options-outline" size={21} color="#FFFFFF" />
                {activeFilters > 0 && <Text style={styles.filterCount}>{activeFilters}</Text>}
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categories.map((item) => <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />)}
            </ScrollView>
            <View style={styles.resultRow}>
              <Text style={styles.count}>{filtered.length} {filtered.length === 1 ? 'product' : 'products'}</Text>
              <Text style={styles.sortLabel}>{sort.replace('-', ' ')}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          !ready ? <View style={styles.state}><ActivityIndicator size="large" color={colors.green} /><Text style={styles.stateTitle}>Loading the rack…</Text></View>
          : error ? <View style={styles.state}><Ionicons name="cloud-offline-outline" size={42} color={colors.green} /><Text style={styles.stateTitle}>{error}</Text><Pressable style={styles.primary} onPress={refresh}><Text style={styles.primaryText}>Try again</Text></Pressable></View>
          : <View style={styles.state}><Ionicons name="bag-handle-outline" size={44} color={colors.green} /><Text style={styles.stateTitle}>No matching finds</Text><Pressable onPress={clearFilters}><Text style={styles.clearText}>Clear filters</Text></Pressable></View>
        }
      />

      <Modal visible={filtersOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFiltersOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters & sorting</Text>
            <Pressable onPress={() => setFiltersOpen(false)}><Ionicons name="close" size={26} color={colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <FilterGroup title="Sort" values={['newest', 'price-low', 'price-high', 'name']} selected={sort} onSelect={(value) => setSort(value as Sort)} />
            <FilterGroup title="Brand" values={brands} selected={brand} onSelect={setBrand} />
            <FilterGroup title="Size" values={sizes} selected={size} onSelect={setSize} />
            <FilterGroup title="Condition" values={conditions} selected={condition} onSelect={setCondition} />
            <Text style={styles.groupTitle}>Maximum price</Text>
            <TextInput style={styles.priceInput} value={maxPrice} onChangeText={setMaxPrice} keyboardType="decimal-pad" placeholder="No maximum" placeholderTextColor={colors.muted} />
          </ScrollView>
          <View style={styles.modalFooter}>
            <Pressable style={styles.clearButton} onPress={clearFilters}><Text style={styles.clearButtonText}>Clear</Text></Pressable>
            <Pressable style={styles.applyButton} onPress={() => setFiltersOpen(false)}><Text style={styles.primaryText}>Show {filtered.length} items</Text></Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
}

function FilterGroup({ title, values, selected, onSelect }: { title: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  return <View><Text style={styles.groupTitle}>{title}</Text><View style={styles.wrap}>{values.map((value) => <Chip key={value} label={value.replace('-', ' ')} active={selected === value} onPress={() => onSelect(value)} />)}</View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  list: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 36 },
  headerContent: { marginBottom: 10 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: { color: colors.green, fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  title: { marginTop: 5, color: colors.text, fontSize: 38, lineHeight: 41, fontWeight: '900' },
  subtitle: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 20 },
  cartButton: { position: 'relative', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  badge: { position: 'absolute', top: -5, right: -5, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, textAlign: 'center', color: '#FFFFFF', backgroundColor: colors.green, fontSize: 9, fontWeight: '900', lineHeight: 19 },
  searchRow: { marginTop: 18, flexDirection: 'row', gap: 9 },
  searchBox: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  filterButton: { position: 'relative', width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.green },
  filterCount: { position: 'absolute', top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, textAlign: 'center', lineHeight: 20, color: '#FFFFFF', backgroundColor: colors.danger, fontSize: 10, fontWeight: '900' },
  chips: { paddingVertical: 13, gap: 8 },
  chip: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  chipActive: { borderColor: colors.green, backgroundColor: colors.green },
  chipText: { color: colors.text, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFFFFF' },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
  count: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  sortLabel: { color: colors.green, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  gridRow: { gap: 10 },
  column: { flex: 1, minWidth: 0, marginBottom: 14 },
  state: { minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 13, padding: 28 },
  stateTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  primary: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 13, backgroundColor: colors.green },
  primaryText: { color: '#FFFFFF', fontWeight: '900' },
  clearText: { color: colors.green, fontWeight: '900' },
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: { minHeight: 66, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  modalTitle: { color: colors.text, fontSize: 21, fontWeight: '900' },
  modalBody: { padding: 20, gap: 25 },
  groupTitle: { marginBottom: 10, color: colors.text, fontSize: 15, fontWeight: '900' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priceInput: { minHeight: 50, paddingHorizontal: 14, color: colors.text, borderWidth: 1, borderColor: colors.line, borderRadius: 14, backgroundColor: colors.card },
  modalFooter: { padding: 16, flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.line },
  clearButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  clearButtonText: { color: colors.text, fontWeight: '900' },
  applyButton: { flex: 2, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.green },
});
