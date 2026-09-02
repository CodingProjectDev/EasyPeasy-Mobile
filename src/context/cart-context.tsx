import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type { Product } from '@/types/product';

const CART_KEY = 'easypeasy_mobile_cart_v1';

export type CartEntry = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  ready: boolean;
  items: CartEntry[];
  cartCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const CartContext =
  createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] =
    useState(false);

  const [items, setItems] =
    useState<CartEntry[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadCart() {
      try {
        const raw =
          await AsyncStorage.getItem(
            CART_KEY,
          );

        if (
          mounted &&
          raw
        ) {
          const parsed =
            JSON.parse(raw);

          if (
            Array.isArray(
              parsed,
            )
          ) {
            setItems(
              parsed,
            );
          }
        }
      } catch (error) {
        console.error(
          'MOBILE CART LOAD ERROR:',
          error,
        );
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    }

    void loadCart();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    void AsyncStorage.setItem(
      CART_KEY,
      JSON.stringify(
        items,
      ),
    ).catch(
      (error) => {
        console.error(
          'MOBILE CART SAVE ERROR:',
          error,
        );
      },
    );
  }, [
    items,
    ready,
  ]);

  const addToCart =
    useCallback(
      (
        product: Product,
        quantity = 1,
      ) => {
        if (
          product.inventory <
          1
        ) {
          return;
        }

        setItems(
          (current) => {
            const existing =
              current.find(
                (item) =>
                  item.product.id ===
                  product.id,
              );

            const maxQty =
              Math.max(
                1,
                product.inventory,
              );

            if (existing) {
              return current.map(
                (item) =>
                  item.product.id ===
                  product.id
                    ? {
                        ...item,
                        product,
                        quantity:
                          Math.min(
                            item.quantity +
                              quantity,
                            maxQty,
                          ),
                      }
                    : item,
              );
            }

            return [
              ...current,
              {
                product,
                quantity:
                  Math.min(
                    Math.max(
                      quantity,
                      1,
                    ),
                    maxQty,
                  ),
              },
            ];
          },
        );
      },
      [],
    );

  const updateQuantity =
    useCallback(
      (
        productId: string,
        quantity: number,
      ) => {
        setItems(
          (current) =>
            current
              .map(
                (item) => {
                  if (
                    item.product.id !==
                    productId
                  ) {
                    return item;
                  }

                  if (
                    quantity <=
                    0
                  ) {
                    return null;
                  }

                  return {
                    ...item,
                    quantity:
                      Math.min(
                        quantity,
                        Math.max(
                          1,
                          item.product
                            .inventory,
                        ),
                      ),
                  };
                },
              )
              .filter(
                Boolean,
              ) as CartEntry[],
        );
      },
      [],
    );

  const removeFromCart =
    useCallback(
      (
        productId: string,
      ) => {
        setItems(
          (current) =>
            current.filter(
              (item) =>
                item.product.id !==
                productId,
            ),
        );
      },
      [],
    );

  const clearCart =
    useCallback(
      () => {
        setItems([]);
      },
      [],
    );

  const cartCount =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),
      [items],
    );

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.product.price *
              item.quantity,
          0,
        ),
      [items],
    );

  const value =
    useMemo(
      () => ({
        ready,
        items,
        cartCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }),
      [
        ready,
        items,
        cartCount,
        subtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      ],
    );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const value =
    useContext(
      CartContext,
    );

  if (!value) {
    throw new Error(
      'useCart must be used inside CartProvider',
    );
  }

  return value;
}
