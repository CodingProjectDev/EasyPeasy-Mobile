import { Ionicons } from '@expo/vector-icons';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { cleanupSellPhotos, submitSellRequest, uploadSellPhoto } from '@/lib/store-api';
import { supabase } from '@/lib/supabase';

type Photo = { id: string; uri: string; name: string; type: string };
const conditions = ['Like New', 'Excellent', 'Good', 'Fair'];
const handoffs = ['Discuss With Store', 'Drop Off', 'Pickup'];

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (value) => {
    const random = Math.floor(Math.random() * 16);
    const next = value === 'x' ? random : (random & 0x3) | 0x8;
    return next.toString(16);
  });
}

function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'decimal-pad';
}) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, multiline && styles.textarea]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} keyboardType={keyboardType} /></View>;
}

export default function SellScreen() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [email, setEmail] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [phone, setPhone] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('Excellent');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('Discuss With Store');
  const [description, setDescription] = useState('');
  const [sellerNotes, setSellerNotes] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      setLoggedIn(Boolean(user));
      setEmail(user?.email || '');
      setSellerName(String(user?.user_metadata?.name || user?.user_metadata?.full_name || ''));
      setLoading(false);
    });
  }, []);

  async function choosePhotos() {
    const remaining = 5 - photos.length;
    if (remaining < 1) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access required', 'Allow photo access to select item pictures.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 1,
    });
    if (result.canceled) return;

    setPreparing(true);
    try {
      const prepared: Photo[] = [];
      for (const asset of result.assets.slice(0, remaining)) {
        const context = ImageManipulator.manipulate(asset.uri);
        const largest = Math.max(asset.width, asset.height);
        if (largest > 1600) {
          context.resize(asset.width >= asset.height
            ? { width: 1600, height: null }
            : { width: null, height: 1600 });
        }
        const rendered = await context.renderAsync();
        const saved = await rendered.saveAsync({ compress: 0.82, format: SaveFormat.JPEG });
        prepared.push({ id: uuid(), uri: saved.uri, name: `sell-${Date.now()}-${prepared.length}.jpg`, type: 'image/jpeg' });
      }
      setPhotos((current) => [...current, ...prepared].slice(0, 5));
    } catch (error) {
      Alert.alert('Could not prepare photos', error instanceof Error ? error.message : 'Try different photos.');
    } finally {
      setPreparing(false);
    }
  }

  async function submit() {
    if (!sellerName.trim() || !phone.trim() || !itemName.trim() || !category.trim() || !description.trim()) {
      Alert.alert('Required information missing', 'Complete your details, item name, category, phone, and description.');
      return;
    }
    if (!photos.length) {
      Alert.alert('Photo required', 'Upload at least one clear item photo.');
      return;
    }
    if (!agreed) {
      Alert.alert('Confirmation required', 'Confirm that the item information is accurate and you have permission to sell it.');
      return;
    }

    setBusy(true);
    const uploadedPaths: string[] = [];
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        router.push({ pathname: '/login', params: { next: '/(tabs)/sell' } });
        return;
      }
      const submissionId = uuid();
      const imageUrls: string[] = [];
      for (const photo of photos) {
        const uploaded = await uploadSellPhoto(photo, submissionId, token);
        imageUrls.push(uploaded.url);
        uploadedPaths.push(uploaded.path);
      }
      const result = await submitSellRequest({
        id: submissionId,
        sellerName: sellerName.trim(),
        phone: phone.trim(),
        itemName: itemName.trim(),
        category: category.trim(),
        brand: brand.trim(),
        size: size.trim(),
        condition,
        description: description.trim(),
        expectedPrice: expectedPrice.trim(),
        deliveryMethod,
        sellerNotes: sellerNotes.trim(),
        images: imageUrls,
        imagePaths: uploadedPaths,
      }, token);
      Alert.alert('Item submitted', `Request ${String(result.id || submissionId)} is ready for review.`, [
        { text: 'View my items', onPress: () => router.push('/selling') },
        { text: 'Done' },
      ]);
      setItemName(''); setCategory(''); setBrand(''); setSize(''); setDescription(''); setExpectedPrice(''); setSellerNotes(''); setPhotos([]); setAgreed(false);
    } catch (error) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) await cleanupSellPhotos(uploadedPaths, data.session.access_token);
      Alert.alert('Submission failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color={colors.green} /></View></SafeAreaView>;
  if (!loggedIn) return <SafeAreaView style={styles.safe}><View style={styles.center}><Ionicons name="person-outline" size={48} color={colors.green} /><Text style={styles.centerTitle}>Login to sell an item</Text><Text style={styles.muted}>Selling requests are connected to your customer account.</Text><Pressable style={styles.primary} onPress={() => router.push({ pathname: '/login', params: { next: '/(tabs)/sell' } })}><Text style={styles.primaryText}>Login / Sign Up</Text></Pressable></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>SELL WITH US</Text>
          <Text style={styles.title}>Give it a fresh start.</Text>
          <Text style={styles.intro}>Submit details and clear photos. The EasyPeasy team will review, price, list, and track your payout.</Text>
          <Pressable style={styles.trackButton} onPress={() => router.push('/selling')}><Ionicons name="time-outline" size={19} color={colors.green} /><Text style={styles.trackText}>Track my selling items</Text></Pressable>

          <View style={styles.section}><Text style={styles.sectionTitle}>1. Your details</Text><Field label="Full name" value={sellerName} onChangeText={setSellerName} placeholder="Your full name" /><Field label="Email" value={email} onChangeText={() => {}} placeholder="Account email" /><Field label="Phone" value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" /></View>
          <View style={styles.section}><Text style={styles.sectionTitle}>2. Item details</Text><Field label="Item name" value={itemName} onChangeText={setItemName} placeholder="e.g. Nike Air Max Shoes" /><Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Shoes" /><Field label="Brand" value={brand} onChangeText={setBrand} placeholder="Optional" /><Field label="Size" value={size} onChangeText={setSize} placeholder="e.g. M / 42" /><ChoiceGroup title="Condition" values={conditions} selected={condition} onSelect={setCondition} /><Field label="Expected price" value={expectedPrice} onChangeText={setExpectedPrice} placeholder="Optional" keyboardType="decimal-pad" /><ChoiceGroup title="Item handoff" values={handoffs} selected={deliveryMethod} onSelect={setDeliveryMethod} /><Field label="Description" value={description} onChangeText={setDescription} placeholder="Condition, age, defects, original details…" multiline /></View>
          <View style={styles.section}><Text style={styles.sectionTitle}>3. Photos</Text><Text style={styles.muted}>Upload 1–5 clear photos from multiple angles.</Text><Pressable style={styles.photoButton} disabled={preparing || photos.length >= 5} onPress={() => void choosePhotos()}>{preparing ? <ActivityIndicator color={colors.green} /> : <Ionicons name="images-outline" size={23} color={colors.green} />}<Text style={styles.photoButtonText}>{preparing ? 'Preparing photos…' : `Choose photos (${photos.length}/5)`}</Text></Pressable><View style={styles.photoGrid}>{photos.map((photo, index) => <View style={styles.photoCard} key={photo.id}><Image source={{ uri: photo.uri }} style={styles.photo} /><Text style={styles.photoLabel}>Photo {index + 1}</Text><Pressable style={styles.removePhoto} onPress={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))}><Ionicons name="trash-outline" size={17} color="#FFFFFF" /></Pressable></View>)}</View></View>
          <View style={styles.section}><Text style={styles.sectionTitle}>4. Anything else?</Text><Field label="Notes" value={sellerNotes} onChangeText={setSellerNotes} placeholder="Pickup details, contact time, other information…" multiline /><Pressable style={styles.agreeRow} onPress={() => setAgreed((value) => !value)}><Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={24} color={colors.green} /><Text style={styles.agreeText}>I confirm the information is accurate and I own or have permission to sell this item.</Text></Pressable><Pressable style={[styles.submit, (busy || preparing) && styles.disabled]} disabled={busy || preparing} onPress={() => void submit()}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Submit for review</Text>}</Pressable></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChoiceGroup({ title, values, selected, onSelect }: { title: string; values: string[]; selected: string; onSelect: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{title}</Text><View style={styles.choices}>{values.map((value) => <Pressable key={value} style={[styles.choice, selected === value && styles.choiceActive]} onPress={() => onSelect(value)}><Text style={[styles.choiceText, selected === value && styles.choiceTextActive]}>{value}</Text></Pressable>)}</View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, page: { padding: 20, paddingBottom: 44 },
  eyebrow: { color: colors.green, fontWeight: '900', letterSpacing: 1.4 }, title: { marginTop: 7, color: colors.text, fontSize: 39, lineHeight: 42, fontWeight: '900' }, intro: { marginTop: 10, color: colors.muted, lineHeight: 21 },
  trackButton: { marginTop: 17, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: colors.green, backgroundColor: colors.softGreen }, trackText: { color: colors.darkGreen, fontWeight: '900' },
  section: { marginTop: 18, padding: 18, gap: 15, borderRadius: 21, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card }, sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  field: { gap: 7 }, label: { color: colors.text, fontSize: 13, fontWeight: '800' }, input: { minHeight: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, color: colors.text, backgroundColor: '#FFFFFF' }, textarea: { minHeight: 112, paddingTop: 13 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, choice: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background }, choiceActive: { borderColor: colors.green, backgroundColor: colors.green }, choiceText: { color: colors.text, fontSize: 12, fontWeight: '800' }, choiceTextActive: { color: '#FFFFFF' },
  photoButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, borderWidth: 1, borderColor: colors.green, backgroundColor: colors.softGreen }, photoButtonText: { color: colors.darkGreen, fontWeight: '900' }, photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, photoCard: { position: 'relative', width: '47%', overflow: 'hidden', borderRadius: 13, backgroundColor: colors.background }, photo: { width: '100%', aspectRatio: 1 }, photoLabel: { padding: 8, color: colors.text, fontSize: 11, fontWeight: '800' }, removePhoto: { position: 'absolute', top: 7, right: 7, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(166,75,60,.9)' },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, agreeText: { flex: 1, color: colors.muted, lineHeight: 20 }, submit: { minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.green }, disabled: { opacity: .55 }, primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }, centerTitle: { marginTop: 14, color: colors.text, fontSize: 22, fontWeight: '900' }, muted: { color: colors.muted, lineHeight: 20, textAlign: 'center' }, primary: { marginTop: 18, paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, backgroundColor: colors.green },
});
