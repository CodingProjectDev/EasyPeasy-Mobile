import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { updateProductNotification } from '@/lib/store-api';
import { supabase } from '@/lib/supabase';
import type { StoreSettings } from '@/types/order';
import { Product, productFromRow } from '@/types/product';

const WISHLIST_KEY = 'easypeasy_mobile_wishlist_v1';
const RECENT_KEY = 'easypeasy_mobile_recent_v1';

const defaultSettings: StoreSettings = {
  storeName: 'EasyPeasy-Thrift',
  tagline: 'Secondhand. Standout. So Easy.',
  announcementText:
    'Shipping depends on product and location • Secondhand. Standout. So Easy.',
  storeEmail: '',
  storePhone: '',
  shippingInfo: 'Depends on product and location',
  returnPolicy:
    'Please check each item carefully before purchasing. Contact the store if an item differs materially from its listing.',
  codEnabled: true,
  qrEnabled: true,
  qrImage: '/store-qr.png',
};

type CatalogContextValue = {
  ready: boolean;
  refreshing: boolean;
  error: string;
  products: Product[];
  settings: StoreSettings;
  wishlist: string[];
  recent: string[];
  refresh: () => Promise<void>;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  recordRecent: (productId: string) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

function settingsFromRow(row: any): StoreSettings {
  return {
    storeName: String(row?.store_name || defaultSettings.storeName),
    tagline: String(row?.tagline || defaultSettings.tagline),
    announcementText: String(
      row?.announcement_text || defaultSettings.announcementText,
    ),
    storeEmail: String(row?.store_email || ''),
    storePhone: String(row?.store_phone || ''),
    shippingInfo: String(row?.shipping_info || defaultSettings.shippingInfo),
    returnPolicy: String(row?.return_policy || defaultSettings.returnPolicy),
    codEnabled:
      typeof row?.cod_enabled === 'boolean'
        ? row.cod_enabled
        : defaultSettings.codEnabled,
    qrEnabled:
      typeof row?.qr_enabled === 'boolean'
        ? row.qr_enabled
        : defaultSettings.qrEnabled,
    qrImage: row?.qr_image_path
      ? String(row.qr_image_path)
      : defaultSettings.qrImage,
    logoImage: row?.logo_path ? String(row.logo_path) : undefined,
    instagramUrl: row?.instagram_url ? String(row.instagram_url) : undefined,
    tiktokUrl: row?.tiktok_url ? String(row.tiktok_url) : undefined,
    pinterestUrl: row?.pinterest_url ? String(row.pinterest_url) : undefined,
  };
}

async function readIds(key: string) {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(key)) || '[]');
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState(defaultSettings);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [storageSuffix, setStorageSuffix] = useState('guest');

  const loadRemote = useCallback(async () => {
    setError('');
    const [productsResult, settingsResult] = await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false }),
      supabase.from('store_settings').select('*').eq('id', 1).maybeSingle(),
    ]);

    if (productsResult.error) {
      setError('Could not load products right now.');
    } else {
      setProducts((productsResult.data || []).map(productFromRow));
    }

    if (settingsResult.data) {
      setSettings(settingsFromRow(settingsResult.data));
    }
  }, []);

  const loadLocal = useCallback(async (suffix: string) => {
    const [savedWishlist, savedRecent] = await Promise.all([
      readIds(`${WISHLIST_KEY}_${suffix}`),
      readIds(`${RECENT_KEY}_${suffix}`),
    ]);
    setWishlist(savedWishlist);
    setRecent(savedRecent);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      const suffix = data.session?.user.id || 'guest';
      if (!mounted) return;
      setStorageSuffix(suffix);
      await Promise.all([loadRemote(), loadLocal(suffix)]);
      if (mounted) setReady(true);
    }

    void boot();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const suffix = session?.user.id || 'guest';
      setStorageSuffix(suffix);
      void loadLocal(suffix);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadLocal, loadRemote]);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(
      `${WISHLIST_KEY}_${storageSuffix}`,
      JSON.stringify(wishlist),
    );
  }, [ready, storageSuffix, wishlist]);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(
      `${RECENT_KEY}_${storageSuffix}`,
      JSON.stringify(recent),
    );
  }, [ready, recent, storageSuffix]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadRemote();
    setRefreshing(false);
  }, [loadRemote]);

  const toggleWishlist = useCallback(
    (productId: string) => {
      const saved = wishlist.includes(productId);
      setWishlist((current) =>
        current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId],
      );
      void updateProductNotification(
        productId,
        'wishlist',
        saved ? 'cancel' : 'schedule',
      );
    },
    [wishlist],
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const recordRecent = useCallback((productId: string) => {
    setRecent((current) => [
      productId,
      ...current.filter((id) => id !== productId),
    ].slice(0, 6));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      refreshing,
      error,
      products,
      settings,
      wishlist,
      recent,
      refresh,
      toggleWishlist,
      isWishlisted,
      recordRecent,
    }),
    [
      ready,
      refreshing,
      error,
      products,
      settings,
      wishlist,
      recent,
      refresh,
      toggleWishlist,
      isWishlisted,
      recordRecent,
    ],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) {
    throw new Error('useCatalog must be used inside CatalogProvider');
  }
  return value;
}
