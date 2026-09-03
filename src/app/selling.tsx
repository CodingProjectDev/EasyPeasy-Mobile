import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';
import { money } from '@/lib/checkout';
import { loadSellRequests } from '@/lib/store-api';
import { supabase } from '@/lib/supabase';
import type { SellSubmission } from '@/types/order';

const steps = ['Submitted', 'Under Review', 'Approved', 'Listed', 'Sold', 'Payout Pending', 'Paid'];

export default function SellingScreen() {
  const [items, setItems] = useState<SellSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) {
        router.replace({ pathname: '/login', params: { next: '/selling' } });
        return;
      }
      setItems(await loadSellRequests(data.session.access_token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load selling items.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable><View style={styles.flex}><Text style={styles.headerTitle}>My selling items</Text><Text style={styles.muted}>Review, listing, sale, and payout status</Text></View><Pressable style={styles.add} onPress={() => router.push('/(tabs)/sell')}><Ionicons name="add" size={23} color="#FFFFFF" /></Pressable></View>
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.green} /></View> : <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.green} />}>
      {!!error && <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Try again</Text></Pressable></View>}
      {!error && !items.length && <View style={styles.centerCard}><Ionicons name="cube-outline" size={44} color={colors.green} /><Text style={styles.emptyTitle}>Nothing submitted yet</Text><Text style={styles.muted}>Have something you no longer use? Give it a fresh start.</Text><Pressable style={styles.primary} onPress={() => router.push('/(tabs)/sell')}><Text style={styles.primaryText}>Sell an item</Text></Pressable></View>}
      {items.map((item) => {
        const rejected = item.status === 'Rejected';
        const currentStep = steps.indexOf(item.status);
        return <View style={styles.card} key={item.id}>
          <View style={styles.top}>{item.images?.[0] ? <Image source={{ uri: item.images[0] }} style={styles.image} /> : <View style={[styles.image, styles.noImage]}><Ionicons name="image-outline" size={28} color={colors.muted} /></View>}<View style={styles.flex}><Text style={styles.eyebrow}>{item.category}</Text><Text style={styles.itemName}>{item.item_name}</Text><Text style={styles.muted}>{[item.brand, item.size, item.condition].filter(Boolean).join(' · ')}</Text><Text style={styles.date}>Submitted {new Date(item.created_at).toLocaleDateString()}</Text></View></View>
          <View style={[styles.status, rejected && styles.rejected]}><Text style={[styles.statusText, rejected && styles.rejectedText]}>{item.status}</Text></View>
          {rejected ? <Text style={styles.rejection}>{item.rejection_reason || 'This item was not approved for listing.'}</Text> : <View style={styles.progress}>{steps.map((step, index) => <View style={styles.step} key={step}><View style={[styles.dot, index <= currentStep && styles.dotDone]} /><Text style={[styles.stepText, index <= currentStep && styles.stepDone]}>{step}</Text></View>)}</View>}
          {(item.approved_price != null || item.seller_earning != null) && <View style={styles.moneyBox}><Row label="Approved price" value={item.approved_price == null ? 'Pending' : money(item.approved_price)} /><Row label="Your earning" value={item.seller_earning == null ? 'Pending' : money(item.seller_earning)} /><Row label="Payout" value={item.payout_status || 'Not Due'} /></View>}
        </View>;
      })}
    </ScrollView>}
  </SafeAreaView>;
}

function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><Text style={styles.muted}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, header: { minHeight: 70, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }, add: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: colors.green }, headerTitle: { color: colors.text, fontSize: 20, fontWeight: '900' }, muted: { color: colors.muted, lineHeight: 19 }, list: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 16, paddingBottom: 40, gap: 14 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, centerCard: { minHeight: 400, alignItems: 'center', justifyContent: 'center', padding: 28 }, emptyTitle: { marginTop: 13, color: colors.text, fontSize: 22, fontWeight: '900' }, primary: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, backgroundColor: colors.green }, primaryText: { color: '#FFFFFF', fontWeight: '900' }, error: { padding: 16, borderRadius: 14, backgroundColor: '#FCEAE6', gap: 8 }, errorText: { color: colors.danger }, retry: { color: colors.green, fontWeight: '900' }, card: { padding: 16, gap: 13, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, top: { flexDirection: 'row', gap: 13 }, image: { width: 92, height: 105, borderRadius: 13 }, noImage: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, eyebrow: { color: colors.green, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }, itemName: { marginTop: 3, color: colors.text, fontSize: 18, fontWeight: '900' }, date: { marginTop: 7, color: colors.muted, fontSize: 11 }, status: { alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.softGreen }, statusText: { color: colors.darkGreen, fontSize: 11, fontWeight: '900' }, rejected: { backgroundColor: '#FCEAE6' }, rejectedText: { color: colors.danger }, rejection: { padding: 12, borderRadius: 12, color: colors.danger, backgroundColor: '#FCEAE6', lineHeight: 19 }, progress: { gap: 8 }, step: { flexDirection: 'row', alignItems: 'center', gap: 9 }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line }, dotDone: { backgroundColor: colors.green }, stepText: { color: colors.muted, fontSize: 12 }, stepDone: { color: colors.text, fontWeight: '800' }, moneyBox: { padding: 13, gap: 9, borderRadius: 13, backgroundColor: colors.background }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, rowValue: { color: colors.text, fontWeight: '900' },
});
