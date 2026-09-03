import { Text, View } from 'react-native';
import { PageShell, infoStyles } from '@/components/page-shell';
import { useCatalog } from '@/context/catalog-context';

export default function ShippingReturnsScreen() {
  const { settings } = useCatalog();
  return <PageShell eyebrow="THE DETAILS" title="Shipping & Returns." intro="Review these details before completing an order.">
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Shipping</Text><Text style={infoStyles.text}>{settings.shippingInfo}</Text><Text style={infoStyles.text}>When location-based shipping is required, the store confirms the charge separately and it is paid on delivery.</Text></View>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Returns</Text><Text style={infoStyles.text}>{settings.returnPolicy}</Text></View>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Condition accuracy</Text><Text style={infoStyles.text}>Review product photos, measurements, condition notes, and known flaws before ordering. Contact the store if the delivered item differs materially from the listing.</Text></View>
  </PageShell>;
}
