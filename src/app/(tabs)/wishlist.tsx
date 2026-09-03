import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductCard } from '@/components/product-card';
import { colors } from '@/constants/easypeasy-theme';
import { useCatalog } from '@/context/catalog-context';

export default function WishlistScreen() {
  const { width } = useWindowDimensions();
  const { products, wishlist, ready } = useCatalog();
  const items = products.filter((product) => wishlist.includes(product.id));
  const columns = width >= 800 ? 3 : width >= 350 ? 2 : 1;

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        key={`wishlist-${columns}`}
        data={items}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <View style={styles.column}><ProductCard product={item} /></View>}
        columnWrapperStyle={columns > 1 ? styles.row : undefined}
        contentContainerStyle={[styles.list, !items.length && styles.emptyList]}
        ListHeaderComponent={items.length ? <View style={styles.header}><Text style={styles.eyebrow}>SAVED PIECES</Text><Text style={styles.title}>Wishlist.</Text><Text style={styles.subtitle}>{items.length} {items.length === 1 ? 'item' : 'items'} saved</Text></View> : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name={ready ? 'heart-outline' : 'hourglass-outline'} size={48} color={colors.green} />
            <Text style={styles.emptyTitle}>{ready ? 'Nothing saved yet' : 'Loading wishlist…'}</Text>
            <Text style={styles.text}>{ready ? 'Tap the heart on any product to save it here.' : 'Checking your saved pieces.'}</Text>
            {ready && <Pressable style={styles.button} onPress={() => router.push('/(tabs)/shop')}><Text style={styles.buttonText}>Browse products</Text></Pressable>}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: 14, paddingBottom: 36 },
  emptyList: { flexGrow: 1 },
  header: { padding: 8, paddingBottom: 22 },
  eyebrow: { color: colors.green, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 5, fontSize: 42, fontWeight: '900', color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted },
  row: { gap: 10 },
  column: { flex: 1, minWidth: 0, marginBottom: 14 },
  empty: { flex: 1, minHeight: 480, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle: { marginTop: 14, fontSize: 21, fontWeight: '900', color: colors.text },
  text: { marginTop: 7, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  button: { marginTop: 20, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, backgroundColor: colors.green },
  buttonText: { color: '#FFFFFF', fontWeight: '900' },
});
