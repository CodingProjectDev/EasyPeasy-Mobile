import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { colors } from "@/constants/easypeasy-theme";
import { CatalogProvider } from "@/context/catalog-context";
import { CartProvider } from "@/context/cart-context";

export default function RootLayout() {
  return (
    <CatalogProvider>
      <CartProvider>
        <StatusBar style="light" />

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
      </CartProvider>
    </CatalogProvider>
  );
}
