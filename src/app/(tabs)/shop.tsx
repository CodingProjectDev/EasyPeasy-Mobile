import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';

export default function ShopScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.eyebrow}>THE RACK</Text>
        <Text style={styles.title}>Shop.</Text>

        <View style={styles.empty}>
          <Ionicons name="bag-handle-outline" size={42} color={colors.green} />
          <Text style={styles.emptyTitle}>Products coming next</Text>
          <Text style={styles.muted}>
            Next we will connect this screen to the same Supabase products used
            by easypeasyez.com.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, padding: 22 },
  eyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.5 },
  title: {
    marginTop: 5,
    color: colors.text,
    fontSize: 46,
    fontWeight: '800',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  muted: {
    marginTop: 8,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
