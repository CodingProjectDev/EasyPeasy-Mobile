export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  category: string;
  size: string;
  condition: string;
  brand: string;
  description: string;
  images: string[];
  inventory: number;
  oneOfOne?: boolean;
  newArrival?: boolean;
  vintageFind?: boolean;
  featured?: boolean;
  shippingFee?: number;
  freeShipping?: boolean;
  createdAt: string;
};

export function productFromRow(row: any): Product {
  return {
    id: String(row.id),
    slug: String(row.slug || ''),
    name: String(row.name || ''),
    price: Number(row.price || 0),
    compareAt:
      row.compare_at == null
        ? undefined
        : Number(row.compare_at),
    category: String(row.category || ''),
    size: String(row.size || ''),
    condition: String(row.condition || ''),
    brand: String(row.brand || ''),
    description: String(row.description || ''),
    images: Array.isArray(row.images)
      ? row.images.map(String)
      : [],
    inventory: Number(row.inventory || 0),
    oneOfOne: Boolean(row.one_of_one),
    newArrival: Boolean(row.new_arrival),
    vintageFind: Boolean(row.vintage_find),
    featured: Boolean(row.featured),
    shippingFee:
      row.shipping_fee == null
        ? undefined
        : Number(row.shipping_fee),
    freeShipping: Boolean(row.free_shipping),
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : new Date().toISOString(),
  };
}
