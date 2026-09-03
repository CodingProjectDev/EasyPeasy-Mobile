import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import {
  useEffect,
  useState,
} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const params = useLocalSearchParams<{ next?: string }>();
  const nextPath =
    params.next === '/checkout'
      ? '/checkout'
      : params.next === '/orders'
        ? '/orders'
        : params.next === '/selling'
          ? '/selling'
          : params.next === '/(tabs)/sell'
            ? '/(tabs)/sell'
            : '/(tabs)/account';

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace(nextPath);
      }
    });
  }, [nextPath]);

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (
      !normalizedEmail ||
      !password ||
      (mode === 'signup' && !name.trim())
    ) {
      Alert.alert(
        'Missing information',
        'Complete every required field.',
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Use at least 6 characters.',
      );
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: name.trim(),
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          router.replace(nextPath);
          return;
        }

        setMessage(
          'Check your email and confirm your account, then return here to log in.',
        );
        setMode('login');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      router.replace(nextPath);
    } catch (error) {
      Alert.alert(
        mode === 'signup' ? 'Sign up failed' : 'Login failed',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  function openPasswordReset() {
    router.push('/forgot-password');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable style={styles.back} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.eyebrow}>EASYPEASY ACCOUNT</Text>
            <Text style={styles.title}>
              {mode === 'login' ? 'Welcome back.' : 'Create your account.'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'login'
                ? 'Log in to place orders and track their status.'
                : 'Use the same account on the website and mobile app.'}
            </Text>

            <View style={styles.card}>
              {mode === 'signup' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Full name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    textContentType="name"
                    placeholder="Your full name"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType={
                    mode === 'login' ? 'password' : 'newPassword'
                  }
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.muted}
                />
              </View>

              {message ? <Text style={styles.message}>{message}</Text> : null}

              <Pressable
                style={[styles.primary, busy && styles.disabled]}
                disabled={busy}
                onPress={() => void submit()}
              >
                <Text style={styles.primaryText}>
                  {busy
                    ? 'Please wait…'
                    : mode === 'login'
                      ? 'Log in'
                      : 'Create account'}
                </Text>
              </Pressable>

              {mode === 'login' && (
                <Pressable onPress={openPasswordReset}>
                  <Text style={styles.link}>Forgot password?</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => {
                setMode((current) =>
                  current === 'login' ? 'signup' : 'login',
                );
                setMessage('');
              }}
            >
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? 'New to EasyPeasy? Create an account'
                  : 'Already have an account? Log in'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  header: { height: 58, paddingHorizontal: 18, justifyContent: 'center' },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', padding: 22 },
  eyebrow: { color: colors.green, fontWeight: '900', letterSpacing: 1.4 },
  title: { marginTop: 8, color: colors.text, fontSize: 38, fontWeight: '900' },
  subtitle: { marginTop: 10, color: colors.muted, fontSize: 15, lineHeight: 22 },
  card: {
    marginTop: 28,
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 17,
  },
  field: { gap: 7 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 16,
  },
  message: {
    borderRadius: 12,
    padding: 12,
    color: colors.darkGreen,
    backgroundColor: colors.softGreen,
    lineHeight: 19,
  },
  primary: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.green,
  },
  disabled: { opacity: 0.55 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  link: { textAlign: 'center', color: colors.green, fontWeight: '800' },
  switchText: {
    marginTop: 22,
    textAlign: 'center',
    color: colors.green,
    fontWeight: '800',
  },
});
