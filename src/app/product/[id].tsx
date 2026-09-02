import { Ionicons } from '@expo/vector-icons';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { colors } from '@/constants/easypeasy-theme';
import { useCart } from '@/context/cart-context';
import { supabase } from '@/lib/supabase';
import {
  Product,
  productFromRow,
} from '@/types/product';

function money(
  value: number,
) {
  return `Rs. ${Math.round(
    value,
  ).toLocaleString()}`;
}

function discountPercent(
  product?: Product | null,
) {
  if (
    !product?.compareAt ||
    product.compareAt <=
      product.price
  ) {
    return null;
  }

  return Math.round(
    (1 -
      product.price /
        product.compareAt) *
      100,
  );
}

export default function ProductDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const productId =
    Array.isArray(
      params.id,
    )
      ? params.id[0]
      : params.id;

  const {
    addToCart,
    cartCount,
  } = useCart();

  const [
    product,
    setProduct,
  ] =
    useState<Product | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const [
    activeImage,
    setActiveImage,
  ] = useState(0);

  const [
    added,
    setAdded,
  ] = useState(false);

  useEffect(() => {
    let mounted =
      true;

    async function load() {
      if (!productId) {
        if (mounted) {
          setError(
            'Product not found.',
          );
          setLoading(false);
        }

        return;
      }

      const {
        data,
        error:
          loadError,
      } = await supabase
        .from('products')
        .select('*')
        .eq(
          'id',
          productId,
        )
        .eq(
          'active',
          true,
        )
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (
        loadError ||
        !data
      ) {
        console.error(
          'MOBILE PRODUCT LOAD ERROR:',
          loadError,
        );

        setError(
          'This product could not be loaded.',
        );
        setLoading(false);

        return;
      }

      setProduct(
        productFromRow(
          data,
        ),
      );

      setLoading(false);
    }

    void load();

    return () => {
      mounted =
        false;
    };
  }, [productId]);

  const discount =
    useMemo(
      () =>
        discountPercent(
          product,
        ),
      [product],
    );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safe}
      >
        <View
          style={
            styles.centerState
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.green
            }
          />

          <Text
            style={
              styles.stateText
            }
          >
            Loading product…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error ||
    !product
  ) {
    return (
      <SafeAreaView
        style={styles.safe}
      >
        <View
          style={
            styles.centerState
          }
        >
          <Ionicons
            name="alert-circle-outline"
            size={46}
            color={
              colors.green
            }
          />

          <Text
            style={
              styles.stateTitle
            }
          >
            Product unavailable
          </Text>

          <Text
            style={
              styles.stateText
            }
          >
            {error ||
              'This product is no longer available.'}
          </Text>

          <Pressable
            style={
              styles.primaryButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const images =
    product.images.filter(
      Boolean,
    );

  const soldOut =
    product.inventory <
    1;

  return (
    <SafeAreaView
      style={styles.safe}
      edges={[
        'top',
      ]}
    >
      <View
        style={
          styles.topBar
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

        <Text
          style={
            styles.topTitle
          }
          numberOfLines={1}
        >
          Product details
        </Text>

        <Pressable
          style={
            styles.cartButton
          }
          onPress={() =>
            router.push(
              '/cart',
            )
          }
        >
          <Ionicons
            name="bag-outline"
            size={22}
            color={
              colors.text
            }
          />

          {cartCount >
            0 && (
            <View
              style={
                styles.cartBadge
              }
            >
              <Text
                style={
                  styles.cartBadgeText
                }
              >
                {cartCount >
                99
                  ? '99+'
                  : cartCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.page}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.imageCard
          }
        >
          {images.length >
          0 ? (
            <Image
              source={{
                uri:
                  images[
                    activeImage
                  ] ||
                  images[0],
              }}
              style={
                styles.mainImage
              }
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.noImage
              }
            >
              <Ionicons
                name="image-outline"
                size={52}
                color={
                  colors.muted
                }
              />

              <Text
                style={
                  styles.noImageText
                }
              >
                No product image
              </Text>
            </View>
          )}

          {soldOut && (
            <View
              style={
                styles.soldOverlay
              }
            >
              <Text
                style={
                  styles.soldText
                }
              >
                SOLD OUT
              </Text>
            </View>
          )}
        </View>

        {images.length >
          1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.thumbnails
            }
          >
            {images.map(
              (
                image,
                index,
              ) => (
                <Pressable
                  key={`${image}-${index}`}
                  onPress={() =>
                    setActiveImage(
                      index,
                    )
                  }
                  style={[
                    styles.thumbnailWrap,
                    activeImage ===
                      index &&
                      styles.thumbnailActive,
                  ]}
                >
                  <Image
                    source={{
                      uri: image,
                    }}
                    style={
                      styles.thumbnail
                    }
                  />
                </Pressable>
              ),
            )}
          </ScrollView>
        )}

        <View
          style={
            styles.infoCard
          }
        >
          <View
            style={
              styles.labelRow
            }
          >
            {!!product.newArrival && (
              <View
                style={
                  styles.greenPill
                }
              >
                <Text
                  style={
                    styles.greenPillText
                  }
                >
                  NEW
                </Text>
              </View>
            )}

            {!!discount && (
              <View
                style={
                  styles.greenPill
                }
              >
                <Text
                  style={
                    styles.greenPillText
                  }
                >
                  {discount}% OFF
                </Text>
              </View>
            )}

            {!!product.oneOfOne && (
              <View
                style={
                  styles.softPill
                }
              >
                <Text
                  style={
                    styles.softPillText
                  }
                >
                  ONE-OF-ONE
                </Text>
              </View>
            )}
          </View>

          {!!product.brand && (
            <Text
              style={
                styles.brand
              }
            >
              {product.brand}
            </Text>
          )}

          <Text
            style={
              styles.name
            }
          >
            {product.name}
          </Text>

          <View
            style={
              styles.priceRow
            }
          >
            <Text
              style={
                styles.price
              }
            >
              {money(
                product.price,
              )}
            </Text>

            {product.compareAt &&
              product.compareAt >
                product.price && (
                <Text
                  style={
                    styles.compareAt
                  }
                >
                  {money(
                    product.compareAt,
                  )}
                </Text>
              )}
          </View>

          <View
            style={
              styles.detailGrid
            }
          >
            <View
              style={
                styles.detailItem
              }
            >
              <Text
                style={
                  styles.detailLabel
                }
              >
                CONDITION
              </Text>

              <Text
                style={
                  styles.detailValue
                }
              >
                {product.condition ||
                  'Not listed'}
              </Text>
            </View>

            <View
              style={
                styles.detailItem
              }
            >
              <Text
                style={
                  styles.detailLabel
                }
              >
                SIZE
              </Text>

              <Text
                style={
                  styles.detailValue
                }
              >
                {product.size ||
                  'Not listed'}
              </Text>
            </View>

            <View
              style={
                styles.detailItem
              }
            >
              <Text
                style={
                  styles.detailLabel
                }
              >
                CATEGORY
              </Text>

              <Text
                style={
                  styles.detailValue
                }
                numberOfLines={1}
              >
                {product.category ||
                  'Not listed'}
              </Text>
            </View>

            <View
              style={
                styles.detailItem
              }
            >
              <Text
                style={
                  styles.detailLabel
                }
              >
                STOCK
              </Text>

              <Text
                style={
                  styles.detailValue
                }
              >
                {soldOut
                  ? 'Sold out'
                  : product.inventory}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.shippingBox
            }
          >
            <Ionicons
              name="car-outline"
              size={21}
              color={
                colors.green
              }
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.shippingTitle
                }
              >
                Shipping
              </Text>

              <Text
                style={
                  styles.shippingText
                }
              >
                {product.freeShipping
                  ? 'Free shipping'
                  : product.shippingFee !=
                        null &&
                      product.shippingFee >
                        0
                    ? `${money(
                        product.shippingFee,
                      )} shipping`
                    : 'Depends on product and location'}
              </Text>
            </View>
          </View>

          {!!product.description && (
            <View
              style={
                styles.description
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                About this item
              </Text>

              <Text
                style={
                  styles.descriptionText
                }
              >
                {product.description}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={
          styles.bottomBar
        }
      >
        <View>
          <Text
            style={
              styles.bottomLabel
            }
          >
            PRICE
          </Text>

          <Text
            style={
              styles.bottomPrice
            }
          >
            {money(
              product.price,
            )}
          </Text>
        </View>

        <Pressable
          disabled={soldOut}
          style={[
            styles.addButton,
            soldOut &&
              styles.addButtonDisabled,
          ]}
          onPress={() => {
            addToCart(
              product,
              1,
            );

            setAdded(true);

            setTimeout(
              () =>
                setAdded(
                  false,
                ),
              1600,
            );
          }}
        >
          <Ionicons
            name={
              added
                ? 'checkmark'
                : 'bag-add-outline'
            }
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.addButtonText
            }
          >
            {soldOut
              ? 'Sold out'
              : added
                ? 'Added'
                : 'Add to cart'}
          </Text>
        </Pressable>
      </View>
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

    topBar: {
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
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

    cartButton: {
      position: 'relative',
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

    cartBadge: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 19,
      height: 19,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        colors.green,
      paddingHorizontal: 4,
    },

    cartBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
    },

    topTitle: {
      flex: 1,
      paddingHorizontal: 12,
      textAlign: 'center',
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },

    page: {
      flex: 1,
    },

    content: {
      paddingBottom: 24,
    },

    imageCard: {
      margin: 14,
      aspectRatio: 0.88,
      overflow: 'hidden',
      borderRadius: 24,
      backgroundColor:
        '#EEECE5',
      borderWidth: 1,
      borderColor:
        colors.line,
    },

    mainImage: {
      width: '100%',
      height: '100%',
    },

    noImage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    noImageText: {
      marginTop: 8,
      color: colors.muted,
      fontSize: 13,
    },

    soldOverlay: {
      position: 'absolute',
      top: 18,
      left: 18,
      borderRadius: 999,
      backgroundColor:
        colors.text,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },

    soldText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
    },

    thumbnails: {
      paddingHorizontal: 14,
      paddingBottom: 6,
      gap: 10,
    },

    thumbnailWrap: {
      width: 68,
      height: 68,
      overflow: 'hidden',
      borderRadius: 13,
      borderWidth: 2,
      borderColor:
        'transparent',
      backgroundColor:
        colors.card,
    },

    thumbnailActive: {
      borderColor:
        colors.green,
    },

    thumbnail: {
      width: '100%',
      height: '100%',
    },

    infoCard: {
      marginHorizontal: 14,
      marginTop: 10,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor:
        colors.line,
      backgroundColor:
        colors.card,
    },

    labelRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      marginBottom: 10,
    },

    greenPill: {
      borderRadius: 999,
      backgroundColor:
        colors.green,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    greenPillText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.7,
    },

    softPill: {
      borderRadius: 999,
      backgroundColor:
        colors.softGreen,
      paddingHorizontal: 9,
      paddingVertical: 5,
    },

    softPillText: {
      color:
        colors.darkGreen,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.7,
    },

    brand: {
      color: colors.green,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      textTransform:
        'uppercase',
    },

    name: {
      marginTop: 5,
      color: colors.text,
      fontSize: 29,
      lineHeight: 33,
      fontWeight: '800',
    },

    priceRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 9,
    },

    price: {
      color:
        colors.darkGreen,
      fontSize: 23,
      fontWeight: '900',
    },

    compareAt: {
      color: colors.muted,
      fontSize: 14,
      textDecorationLine:
        'line-through',
    },

    detailGrid: {
      marginTop: 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    detailItem: {
      width: '48%',
      minHeight: 72,
      borderRadius: 14,
      backgroundColor:
        colors.background,
      padding: 12,
    },

    detailLabel: {
      color: colors.muted,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.9,
    },

    detailValue: {
      marginTop: 5,
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },

    shippingBox: {
      marginTop: 18,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      borderRadius: 14,
      backgroundColor:
        colors.softGreen,
      padding: 14,
    },

    shippingTitle: {
      color:
        colors.darkGreen,
      fontSize: 13,
      fontWeight: '800',
    },

    shippingText: {
      marginTop: 2,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
    },

    description: {
      marginTop: 22,
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
    },

    descriptionText: {
      marginTop: 8,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 22,
    },

    bottomBar: {
      minHeight: 84,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor:
        colors.line,
      backgroundColor:
        colors.card,
    },

    bottomLabel: {
      color: colors.muted,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.8,
    },

    bottomPrice: {
      marginTop: 2,
      color:
        colors.darkGreen,
      fontSize: 19,
      fontWeight: '900',
    },

    addButton: {
      minHeight: 50,
      minWidth: 170,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      backgroundColor:
        colors.green,
      paddingHorizontal: 20,
    },

    addButtonDisabled: {
      opacity: 0.45,
    },

    addButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
    },

    centerState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },

    stateTitle: {
      marginTop: 14,
      color: colors.text,
      fontSize: 21,
      fontWeight: '800',
      textAlign: 'center',
    },

    stateText: {
      marginTop: 8,
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },

    primaryButton: {
      marginTop: 18,
      borderRadius: 12,
      backgroundColor:
        colors.green,
      paddingHorizontal: 22,
      paddingVertical: 12,
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
  });
