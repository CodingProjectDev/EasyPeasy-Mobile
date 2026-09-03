import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PageShell } from '@/components/page-shell';
import { colors } from '@/constants/easypeasy-theme';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim()) { Alert.alert('Email required'); return; }
    setBusy(true);
    const redirectTo = Linking.createURL('/reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    setBusy(false);
    if (error) { Alert.alert('Reset email not sent', error.message); return; }
    setSent(true);
  }

  return <PageShell eyebrow="ACCOUNT RECOVERY" title="Reset password." intro="We’ll email you a secure link to choose a new password.">
    <View style={styles.card}>{sent ? <><Text style={styles.successTitle}>Check your email</Text><Text style={styles.text}>Open the recovery link on this phone to return to EasyPeasy and set a new password.</Text></> : <><Text style={styles.label}>Account email</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.muted} /><Pressable style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={() => void submit()}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send reset link</Text>}</Pressable></>}</View>
  </PageShell>;
}

const styles = StyleSheet.create({ card: { marginTop: 20, padding: 20, gap: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, label: { color: colors.text, fontWeight: '800' }, input: { minHeight: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, color: colors.text, backgroundColor: '#FFFFFF' }, button: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.green }, buttonText: { color: '#FFFFFF', fontWeight: '900' }, disabled: { opacity: .55 }, successTitle: { color: colors.text, fontSize: 21, fontWeight: '900' }, text: { color: colors.muted, lineHeight: 21 } });
