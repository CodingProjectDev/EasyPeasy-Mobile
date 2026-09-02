import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';

export default function SellScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <Text style={styles.eyebrow}>SELL WITH EASYPEASY</Text>
        <Text style={styles.title}>Give it a second life.</Text>

        <View style={styles.card}>
          <Ionicons name="camera-outline" size={38} color={colors.green} />
          <Text style={styles.cardTitle}>Seller tools coming next</Text>
          <Text style={styles.text}>
            Later customers will be able to take photos, submit items and track
            selling requests directly from the app.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, padding: 22 },
  eyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.4 },
  title: {
    marginTop: 8,
    fontSize: 42,
    lineHeight: 45,
    fontWeight: '800',
    color: colors.text,
  },
  card: {
    marginTop: 30,
    padding: 28,
    borderRadius: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  text: { marginTop: 8, color: colors.muted, lineHeight: 22 },
});
