import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';
import { PageShell, infoStyles } from '@/components/page-shell';
import { useCatalog } from '@/context/catalog-context';
import { colors } from '@/constants/easypeasy-theme';

export default function StoreInformationScreen() {
  const { settings } = useCatalog();
  const payments = [settings.codEnabled && 'Cash on Delivery', settings.qrEnabled && 'QR Payment'].filter(Boolean).join(', ') || 'Unavailable';
  return <PageShell eyebrow="STORE DETAILS" title={settings.storeName} intro={settings.tagline}>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Contact</Text>{settings.storeEmail ? <Pressable style={infoStyles.row} onPress={() => Linking.openURL(`mailto:${settings.storeEmail}`)}><Ionicons name="mail-outline" size={21} color={colors.green} /><Text style={infoStyles.rowText}>{settings.storeEmail}</Text></Pressable> : null}{settings.storePhone ? <Pressable style={infoStyles.row} onPress={() => Linking.openURL(`tel:${settings.storePhone}`)}><Ionicons name="call-outline" size={21} color={colors.green} /><Text style={infoStyles.rowText}>{settings.storePhone}</Text></Pressable> : null}</View>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Shipping</Text><Text style={infoStyles.text}>{settings.shippingInfo}</Text></View>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Payment methods</Text><Text style={infoStyles.text}>{payments}</Text></View>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Return policy</Text><Text style={infoStyles.text}>{settings.returnPolicy}</Text></View>
  </PageShell>;
}
