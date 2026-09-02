import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';

export default function WishlistScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.title}>Wishlist.</Text>

        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={colors.green} />
          <Text style={styles.emptyTitle}>Nothing saved yet</Text>
          <Text style={styles.text}>Products you love will appear here.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, padding: 22 },
  title: { fontSize: 44, fontWeight: '800', color: colors.text },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: {
    marginTop: 14,
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
  },
  text: { marginTop: 7, color: colors.muted },
});
