import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';

export function PageShell({ eyebrow, title, intro, children }: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable><Text style={styles.headerTitle}>{title}</Text></View>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      {!!intro && <Text style={styles.intro}>{intro}</Text>}
      {children}
    </ScrollView>
  </SafeAreaView>;
}

export const infoStyles = StyleSheet.create({
  card: { marginTop: 16, padding: 18, gap: 10, borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  heading: { color: colors.text, fontSize: 19, fontWeight: '900' },
  text: { color: colors.muted, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  rowText: { flex: 1, color: colors.text, lineHeight: 20 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 64, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  headerTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '900' },
  page: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: 20, paddingBottom: 44 },
  eyebrow: { color: colors.green, fontWeight: '900', letterSpacing: 1.3 },
  title: { marginTop: 6, color: colors.text, fontSize: 38, fontWeight: '900' },
  intro: { marginTop: 10, color: colors.muted, fontSize: 15, lineHeight: 22 },
});
