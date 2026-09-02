import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';

const links = [
  { title: 'My Orders', icon: 'cube-outline' },
  { title: 'My Selling Items', icon: 'pricetag-outline' },
  { title: 'Wishlist', icon: 'heart-outline' },
  { title: 'Help & Support', icon: 'help-circle-outline' },
] as const;

export default function AccountScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>My EasyPeasy.</Text>

        <View style={styles.card}>
          {links.map((item, index) => (
            <Pressable
              style={[
                styles.row,
                index < links.length - 1 && styles.rowBorder,
              ]}
              key={item.title}
            >
              <View style={styles.left}>
                <Ionicons name={item.icon} size={22} color={colors.green} />
                <Text style={styles.rowText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <Text style={styles.note}>
          Login and real account data will be connected after Supabase setup.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, padding: 22 },
  eyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.4 },
  title: {
    marginTop: 5,
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
  },
  card: {
    marginTop: 28,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    minHeight: 68,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.line },
  left: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  rowText: { fontSize: 16, fontWeight: '700', color: colors.text },
  note: { marginTop: 18, color: colors.muted, lineHeight: 20 },
});
