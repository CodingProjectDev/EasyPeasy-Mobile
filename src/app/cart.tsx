import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { colors } from '@/constants/easypeasy-theme';
import {
  CartEntry,
  useCart,
} from '@/context/cart-context';

function money(
  value: number,
) {
  return `Rs. ${Math.round(
    value,
  ).toLocaleString()}`;
}

function CartRow({
  item,
}: {
  item: CartEntry;
}) {
  const {
    updateQuantity,
    removeFromCart,
  } = useCart();

  const image =
    item.product.images[0] ||
    '';

  return (
    <View
      style={
        styles.cartRow
      }
    >
      <Pressable
        onPress={() =>
          router.push({
            pathname:
              '/product/[id]',
            params: {
              id:
                item.product.id,
            },
          })
        }
      >
        {image ? (
          <Image
            source={{
              uri: image,
            }}
            style={
              styles.productImage
            }
          />
        ) : (
          <View
            style={
              styles.noImage
            }
          >
            <Ionicons
              name="image-outline"
              size={28}
              color={
                colors.muted
              }
            />
          </View>
        )}
      </Pressable>

      <View
        style={
          styles.productInfo
        }
      >
        <Text
          style={
            styles.productName
          }
          numberOfLines={2}
        >
          {item.product.name}
        </Text>

        <Text
          style={
            styles.productMeta
          }
        >
          {item.product.size
            ? `Size ${item.product.size}`
            : item.product.condition}
        </Text>

        <Text
          style={
            styles.productPrice
          }
        >
          {money(
            item.product.price *
              item.quantity,
          )}
        </Text>

        <View
          style={
            styles.rowBottom
          }
        >
          <View
            style={
              styles.quantity
            }
          >
            <Pressable
              style={
                styles.qtyButton
              }
              onPress={() =>
                updateQuantity(
                  item.product.id,
                  item.quantity -
                    1,
                )
              }
            >
              <Ionicons
                name="remove"
                size={18}
                color={
                  colors.text
                }
              />
            </Pressable>

            <Text
              style={
                styles.qtyText
              }
            >
              {item.quantity}
            </Text>

            <Pressable
              style={
                styles.qtyButton
              }
              disabled={
                item.quantity >=
                item.product
                  .inventory
              }
              onPress={() =>
                updateQuantity(
                  item.product.id,
                  item.quantity +
                    1,
                )
              }
            >
              <Ionicons
                name="add"
                size={18}
                color={
                  item.quantity >=
                  item.product
                    .inventory
                    ? colors.line
                    : colors.text
                }
              />
            </Pressable>
          </View>

          <Pressable
            onPress={() =>
              removeFromCart(
                item.product.id,
              )
            }
          >
            <Text
              style={
                styles.remove
              }
            >
              Remove
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const {
    ready,
    items,
    cartCount,
    subtotal,
    clearCart,
  } = useCart();

  return (
    <SafeAreaView
      style={styles.safe}
      edges={[
        'top',
      ]}
    >
      <View
        style={
          styles.header
        }
      >
        <Pressable
          style={
            styles.iconButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={
              colors.text
            }
          />
        </Pressable>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Your bag
          </Text>

          <Text
            style={
              styles.headerSubtitle
            }
          >
            {cartCount}{' '}
            {cartCount ===
            1
              ? 'item'
              : 'items'}
          </Text>
        </View>

        {items.length >
          0 && (
          <Pressable
            onPress={
              clearCart
            }
          >
            <Text
              style={
                styles.clear
              }
            >
              Clear
            </Text>
          </Pressable>
        )}
      </View>

      {!ready ? (
        <View
          style={
            styles.empty
          }
        >
          <Text
            style={
              styles.emptyTitle
            }
          >
            Loading your bag…
          </Text>
        </View>
      ) : items.length ===
        0 ? (
        <View
          style={
            styles.empty
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="bag-handle-outline"
              size={42}
              color={
                colors.green
              }
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            Your bag is empty
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            Add something you love from the EasyPeasy rack.
          </Text>

          <Pressable
            style={
              styles.shopButton
            }
            onPress={() =>
              router.replace(
                '/(tabs)/shop',
              )
            }
          >
            <Text
              style={
                styles.shopButtonText
              }
            >
              Start shopping
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(
              item,
            ) =>
              item.product.id
            }
            renderItem={({
              item,
            }) => (
              <CartRow
                item={item}
              />
            )}
            contentContainerStyle={
              styles.list
            }
            showsVerticalScrollIndicator={
              false
            }
          />

          <View
            style={
              styles.summary
            }
          >
            <View
              style={
                styles.summaryRow
              }
            >
              <Text
                style={
                  styles.summaryLabel
                }
              >
                Subtotal
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {money(
                  subtotal,
                )}
              </Text>
            </View>

            <Text
              style={
                styles.shippingNote
              }
            >
              Shipping is calculated from each product. Any location-based fee is confirmed separately and paid on delivery.
            </Text>

            <Pressable
              style={
                styles.checkoutButton
              }
              onPress={() =>
                router.push(
                  '/checkout',
                )
              }
            >
              <Text
                style={
                  styles.checkoutButtonText
                }
              >
                Continue to checkout
              </Text>

              <Ionicons
                name="arrow-forward"
                size={19}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    header: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingHorizontal: 14,
      borderBottomWidth: 1,
      borderBottomColor:
        colors.line,
      backgroundColor:
        colors.background,
    },

    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.card,
      borderWidth: 1,
      borderColor:
        colors.line,
    },

    headerTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
    },

    headerSubtitle: {
      marginTop: 2,
      color: colors.muted,
      fontSize: 11,
    },

    clear: {
      color: colors.green,
      fontSize: 13,
      fontWeight: '800',
    },

    list: {
      padding: 14,
      paddingBottom: 20,
      gap: 12,
    },

    cartRow: {
      flexDirection: 'row',
      gap: 13,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        colors.line,
      backgroundColor:
        colors.card,
      padding: 11,
    },

    productImage: {
      width: 104,
      height: 128,
      borderRadius: 13,
      backgroundColor:
        '#EEECE5',
    },

    noImage: {
      width: 104,
      height: 128,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        '#EEECE5',
    },

    productInfo: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 2,
    },

    productName: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '800',
    },

    productMeta: {
      marginTop: 4,
      color: colors.muted,
      fontSize: 11,
    },

    productPrice: {
      marginTop: 8,
      color:
        colors.darkGreen,
      fontSize: 15,
      fontWeight: '900',
    },

    rowBottom: {
      marginTop: 'auto',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 10,
    },

    quantity: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        colors.line,
      overflow: 'hidden',
    },

    qtyButton: {
      width: 34,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.background,
    },

    qtyText: {
      minWidth: 30,
      textAlign: 'center',
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
    },

    remove: {
      color:
        colors.danger,
      fontSize: 11,
      fontWeight: '800',
    },

    summary: {
      borderTopWidth: 1,
      borderTopColor:
        colors.line,
      backgroundColor:
        colors.card,
      padding: 16,
    },

    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    summaryLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },

    summaryValue: {
      color:
        colors.darkGreen,
      fontSize: 20,
      fontWeight: '900',
    },

    shippingNote: {
      marginTop: 7,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
    },

    checkoutButton: {
      marginTop: 14,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      backgroundColor:
        colors.green,
    },

    checkoutButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },

    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.softGreen,
    },

    emptyTitle: {
      marginTop: 16,
      color: colors.text,
      fontSize: 22,
      fontWeight: '900',
      textAlign: 'center',
    },

    emptyText: {
      marginTop: 7,
      maxWidth: 280,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },

    shopButton: {
      marginTop: 18,
      borderRadius: 13,
      backgroundColor:
        colors.green,
      paddingHorizontal: 22,
      paddingVertical: 13,
    },

    shopButtonText: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
  });
