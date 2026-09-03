import { Text, View } from 'react-native';
import { PageShell, infoStyles } from '@/components/page-shell';
import { useCatalog } from '@/context/catalog-context';

export default function AboutScreen() {
  const { settings } = useCatalog();
  return <PageShell eyebrow="OUR STORY" title="About EasyPeasy." intro={settings.tagline}>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Style deserves another life</Text><Text style={infoStyles.text}>EasyPeasy-Thrift brings together thoughtfully selected new, pre-loved, vintage, and one-of-one pieces. Every listing includes honest condition details so customers can shop with confidence.</Text></View>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Curated, not crowded</Text><Text style={infoStyles.text}>We focus on standout finds instead of endless sameness. Products are reviewed, described, and presented so you can quickly understand what makes each piece special.</Text></View>
    <View style={infoStyles.card}><Text style={infoStyles.heading}>Sell with us</Text><Text style={infoStyles.text}>Customers can submit unused items for review. If accepted, the store handles listing and tracks the item through sale and payout.</Text></View>
  </PageShell>;
}
