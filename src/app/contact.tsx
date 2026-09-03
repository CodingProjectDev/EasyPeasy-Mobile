import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { PageShell, infoStyles } from '@/components/page-shell';
import { colors } from '@/constants/easypeasy-theme';
import { useCatalog } from '@/context/catalog-context';
import { sendContactMessage } from '@/lib/store-api';

export default function ContactScreen() {
  const { settings } = useCatalog();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Required information missing', 'Enter your name, email, and message.');
      return;
    }
    setBusy(true);
    try {
      await sendContactMessage({ name: name.trim(), email: email.trim(), orderNumber: orderNumber.trim(), message: message.trim() });
      setOrderNumber(''); setMessage('');
      Alert.alert('Message sent', 'EasyPeasy received your message.');
    } catch (error) {
      Alert.alert('Message not sent', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  return <PageShell eyebrow="LET'S TALK" title="Contact." intro="Questions about an order, product, shipping, or selling? Send us a message.">
    {(settings.storeEmail || settings.storePhone) && <View style={infoStyles.card}><Text style={infoStyles.heading}>Store contact</Text>{settings.storeEmail ? <Pressable style={infoStyles.row} onPress={() => Linking.openURL(`mailto:${settings.storeEmail}`)}><Ionicons name="mail-outline" size={21} color={colors.green} /><Text style={infoStyles.rowText}>{settings.storeEmail}</Text></Pressable> : null}{settings.storePhone ? <Pressable style={infoStyles.row} onPress={() => Linking.openURL(`tel:${settings.storePhone}`)}><Ionicons name="call-outline" size={21} color={colors.green} /><Text style={infoStyles.rowText}>{settings.storePhone}</Text></Pressable> : null}</View>}
    <View style={styles.form}><Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" /><Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" /><Field label="Order number" value={orderNumber} onChangeText={setOrderNumber} placeholder="Optional" /><Field label="Message" value={message} onChangeText={setMessage} placeholder="How can we help?" multiline /><Pressable style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={() => void submit()}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Send message</Text>}</Pressable></View>
  </PageShell>;
}

function Field({ label, value, onChangeText, placeholder, multiline = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.textarea]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} autoCapitalize={label === 'Email' ? 'none' : 'sentences'} keyboardType={label === 'Email' ? 'email-address' : 'default'} /></View>;
}

const styles = StyleSheet.create({ form: { marginTop: 18, padding: 18, gap: 15, borderRadius: 20, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, field: { gap: 7 }, label: { color: colors.text, fontSize: 13, fontWeight: '800' }, input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, color: colors.text, backgroundColor: '#FFFFFF' }, textarea: { minHeight: 130, paddingTop: 13 }, button: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.green }, buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' }, disabled: { opacity: .55 } });
