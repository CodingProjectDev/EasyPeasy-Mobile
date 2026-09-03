import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';
import { supabase } from '@/lib/supabase';

type LinkRow = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
};

export default function AccountScreen() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) {
      setProfile({ name: '', email: '', phone: '' });
      setLoading(false);
      return;
    }

    let name = String(
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
    );
    let phone = String(user.phone ?? user.user_metadata?.phone ?? '');

    const { data: latestOrder } = await supabase
      .from('orders')
      .select('full_name,phone')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    name = name || String(latestOrder?.full_name ?? '');
    phone = phone || String(latestOrder?.phone ?? '');

    setProfile({
      name: name || 'Not provided',
      email: user.email || 'Not provided',
      phone: phone || 'Not provided',
    });
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAccount();
    }, [loadAccount]),
  );

  const links: LinkRow[] = [
    {
      title: 'My Orders',
      icon: 'cube-outline',
      onPress: () => router.push('/orders'),
    },
    {
      title: 'My Selling Items',
      icon: 'pricetag-outline',
      onPress: () => router.push('/selling'),
    },
    {
      title: 'Wishlist',
      icon: 'heart-outline',
      onPress: () => router.push('/(tabs)/wishlist'),
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => router.push('/contact'),
    },
    {
      title: 'Store Information',
      icon: 'storefront-outline',
      onPress: () => router.push('/store-information'),
    },
    {
      title: 'Shipping & Returns',
      icon: 'car-outline',
      onPress: () => router.push('/shipping-returns'),
    },
    {
      title: 'FAQ',
      icon: 'chatbubble-ellipses-outline',
      onPress: () => router.push('/faq'),
    },
    {
      title: 'About EasyPeasy',
      icon: 'leaf-outline',
      onPress: () => router.push('/about'),
    },
  ];

  async function signOut() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);

    if (error) {
      Alert.alert('Could not sign out', error.message);
      return;
    }

    setProfile({ name: '', email: '', phone: '' });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>My EasyPeasy.</Text>

        {!loading && !profile.email ? (
          <View style={styles.authCard}>
            <View style={styles.authIcon}>
              <Ionicons name="person-outline" size={28} color={colors.green} />
            </View>
            <Text style={styles.authTitle}>Sign in to continue</Text>
            <Text style={styles.authText}>
              Checkout and order history use the same EasyPeasy account as the website.
            </Text>
            <Pressable
              style={styles.loginButton}
              onPress={() =>
                router.push({
                  pathname: '/login',
                  params: { next: '/(tabs)/account' },
                })
              }
            >
              <Text style={styles.loginText}>Login or create account</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileIcon}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.profileLabel}>ACCOUNT INFORMATION</Text>
                <Text style={styles.profileName} numberOfLines={1}>
                  {profile.name || 'Loading…'}
                </Text>
                {!!profile.email && (
                  <Text style={styles.profileDetail} numberOfLines={1}>
                    {profile.email}
                  </Text>
                )}
                {!!profile.phone && (
                  <Text style={styles.profileDetail} numberOfLines={1}>
                    {profile.phone}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.card}>
              {links.map((item, index) => (
                <Pressable
                  style={[
                    styles.row,
                    index < links.length - 1 && styles.rowBorder,
                  ]}
                  key={item.title}
                  onPress={item.onPress}
                >
                  <View style={styles.left}>
                    <Ionicons name={item.icon} size={22} color={colors.green} />
                    <Text style={styles.rowText}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.signOutButton}
              disabled={signingOut}
              onPress={signOut}
            >
              <Text style={styles.signOutText}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flexGrow: 1, padding: 22, paddingBottom: 40 },
  eyebrow: { color: colors.green, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 5, fontSize: 42, fontWeight: '800', color: colors.text },
  authCard: {
    marginTop: 28,
    padding: 24,
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  authIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 31,
    backgroundColor: colors.softGreen,
  },
  authTitle: { marginTop: 15, color: colors.text, fontSize: 20, fontWeight: '900' },
  authText: {
    marginTop: 7,
    maxWidth: 310,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  loginButton: {
    marginTop: 18,
    minHeight: 50,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.green,
  },
  loginText: { color: '#FFFFFF', fontWeight: '900' },
  profileCard: {
    marginTop: 28,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  profileIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.green,
  },
  profileCopy: { flex: 1, minWidth: 0 },
  profileLabel: {
    color: colors.green,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  profileName: { marginTop: 4, color: colors.text, fontSize: 16, fontWeight: '900' },
  profileDetail: { marginTop: 2, color: colors.muted, fontSize: 13, fontWeight: '600' },
  card: {
    marginTop: 16,
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
  signOutButton: {
    marginTop: 20,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  signOutText: { color: colors.danger, fontWeight: '900' },
});
