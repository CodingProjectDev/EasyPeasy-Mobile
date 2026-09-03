import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { PageShell, infoStyles } from '@/components/page-shell';
import { useCatalog } from '@/context/catalog-context';
import { colors } from '@/constants/easypeasy-theme';

export default function FaqScreen() {
  const { settings } = useCatalog();
  const payments = [settings.codEnabled && 'Cash on Delivery', settings.qrEnabled && 'QR Payment'].filter(Boolean).join(' and ') || 'temporarily unavailable';
  const faqs = [
    ['Are all items secondhand?', 'The catalog can include new, pre-loved, vintage, and one-of-one items. Check each product condition.'],
    ['How is shipping calculated?', settings.shippingInfo],
    ['What payment methods are accepted?', payments],
    ['Can I return an item?', settings.returnPolicy],
    ['How do I sell an item?', 'Use the Sell tab, upload clear photos, and submit the item for store review.'],
    ['How do I track an order?', 'Open Account → My Orders to see the latest status.'],
  ];
  return <PageShell eyebrow="NEED HELP?" title="FAQ." intro="Straight answers about shopping, shipping, returns, and selling.">
    {faqs.map(([question, answer]) => <View style={infoStyles.card} key={question}><View style={infoStyles.row}><Ionicons name="help-circle-outline" size={22} color={colors.green} /><Text style={infoStyles.heading}>{question}</Text></View><Text style={infoStyles.text}>{answer}</Text></View>)}
  </PageShell>;
}
