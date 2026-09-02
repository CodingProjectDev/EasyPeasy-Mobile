import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/easypeasy-theme";

const categories = [
  { name: "New In", icon: "sparkles-outline" },
  { name: "Pre-loved", icon: "pricetag-outline" },
  { name: "Jewellery", icon: "diamond-outline" },
  { name: "Baby", icon: "happy-outline" },
] as const;

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>EasyPeasy-Thrift</Text>
            <Text style={styles.tagline}>Secondhand. Standout. So Easy.</Text>
          </View>

          <View style={styles.headerIcons}>
            <Ionicons name="search-outline" size={23} color={colors.text} />
            <Ionicons name="bag-outline" size={23} color={colors.text} />
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>CURATED FINDS · NEW & PRE-LOVED</Text>

          <Text style={styles.heroTitle}>
            Thoughtful finds. Timeless style.
          </Text>

          <Text style={styles.heroCopy}>
            Shop new and pre-loved pieces, discover standout finds, and sell
            items you no longer use.
          </Text>

          <View style={styles.heroActions}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/(tabs)/shop")}
            >
              <Text style={styles.primaryButtonText}>Shop the drop</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push("/sell")}
            >
              <Text style={styles.secondaryButtonText}>Sell with us</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Browse your way</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categories}
        >
          {categories.map((category) => (
            <Pressable
              key={category.name}
              style={styles.category}
              onPress={() => router.push("/shop")}
            >
              <View style={styles.categoryIcon}>
                <Ionicons
                  name={category.icon}
                  size={23}
                  color={colors.darkGreen}
                />
              </View>
              <Text style={styles.categoryText}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.freshCard}>
          <View style={styles.freshIcon}>
            <Ionicons name="leaf-outline" size={30} color={colors.green} />
          </View>

          <Text style={styles.freshTitle}>Fresh finds are coming.</Text>

          <Text style={styles.freshText}>
            Your real EasyPeasy products will appear here after we connect the
            app to Supabase.
          </Text>

          <Pressable
            style={styles.shopButton}
            onPress={() => router.push("/(tabs)/shop")}
          >
            <Text style={styles.shopButtonText}>Explore Shop</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.green },
  page: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 38 },
  header: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: { color: colors.darkGreen, fontSize: 20, fontWeight: "800" },
  tagline: { marginTop: 2, color: colors.muted, fontSize: 10 },
  headerIcons: { flexDirection: "row", gap: 18 },
  hero: {
    margin: 16,
    padding: 24,
    borderRadius: 28,
    backgroundColor: "#ECEBDD",
  },
  eyebrow: {
    color: colors.green,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroTitle: {
    marginTop: 10,
    color: colors.text,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: "800",
  },
  heroCopy: {
    marginTop: 16,
    color: "#555A53",
    fontSize: 16,
    lineHeight: 24,
  },
  heroActions: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    minHeight: 50,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: colors.green,
    borderRadius: 14,
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondaryButton: {
    minHeight: 50,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 14,
  },
  secondaryButtonText: { color: colors.darkGreen, fontWeight: "700" },
  sectionTitle: {
    paddingHorizontal: 18,
    marginTop: 12,
    marginBottom: 14,
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  categories: { paddingHorizontal: 18, gap: 16 },
  category: { width: 78, alignItems: "center" },
  categoryIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEDE5",
    borderWidth: 1,
    borderColor: colors.line,
  },
  categoryText: {
    marginTop: 8,
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  freshCard: {
    marginHorizontal: 16,
    marginTop: 30,
    alignItems: "center",
    padding: 28,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  freshIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softGreen,
  },
  freshTitle: {
    marginTop: 16,
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  freshText: {
    marginTop: 8,
    maxWidth: 300,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  shopButton: {
    marginTop: 18,
    backgroundColor: colors.green,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },
  shopButtonText: { color: "#fff", fontWeight: "800" },
});
