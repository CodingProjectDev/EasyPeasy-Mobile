import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PageShell } from '@/components/page-shell';
import { colors } from '@/constants/easypeasy-theme';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function recover() {
      let error: Error | null = null;
      if (params.code) {
        const result = await supabase.auth.exchangeCodeForSession(params.code);
        error = result.error;
      } else if (params.access_token && params.refresh_token) {
        const result = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
        error = result.error;
      }
      const { data } = await supabase.auth.getSession();
      setReady(Boolean(data.session) && !error);
      setChecking(false);
    }
    void recover();
  }, [params.access_token, params.code, params.refresh_token]);

  async function updatePassword() {
    if (password.length < 6) { Alert.alert('Password too short', 'Use at least 6 characters.'); return; }
    if (password !== confirm) { Alert.alert('Passwords do not match'); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { Alert.alert('Password not updated', error.message); return; }
    Alert.alert('Password updated', 'You can now continue using your account.', [{ text: 'Continue', onPress: () => router.replace('/(tabs)/account') }]);
  }

  return <PageShell eyebrow="ACCOUNT RECOVERY" title="Choose a new password." intro="Use a strong password you do not reuse elsewhere.">
    <View style={styles.card}>{checking ? <ActivityIndicator color={colors.green} /> : !ready ? <><Text style={styles.errorTitle}>Reset link unavailable</Text><Text style={styles.text}>The link is invalid or expired. Request another password-reset email.</Text><Pressable style={styles.button} onPress={() => router.replace('/forgot-password')}><Text style={styles.buttonText}>Request new link</Text></Pressable></> : <><Text style={styles.label}>New password</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 6 characters" placeholderTextColor={colors.muted} /><Text style={styles.label}>Confirm password</Text><TextInput style={styles.input} value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Repeat password" placeholderTextColor={colors.muted} /><Pressable style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={() => void updatePassword()}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Update password</Text>}</Pressable></>}</View>
  </PageShell>;
}

const styles = StyleSheet.create({ card: { marginTop: 20, padding: 20, gap: 12, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, label: { color: colors.text, fontWeight: '800' }, input: { minHeight: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, color: colors.text, backgroundColor: '#FFFFFF' }, button: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.green }, buttonText: { color: '#FFFFFF', fontWeight: '900' }, disabled: { opacity: .55 }, errorTitle: { color: colors.danger, fontSize: 20, fontWeight: '900' }, text: { color: colors.muted, lineHeight: 21 } });
