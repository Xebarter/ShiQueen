import { getSupabaseClient } from '@/lib/supabase/client';
import { isSupabaseOfflineError } from '@/lib/supabase/errors';
import { TABLES } from '@/lib/supabase/tables';
import { SEED_PACKAGES, SEED_PRODUCTS } from '@/lib/firebase/seed-data';
import { ensureSuppliersReady } from '@/lib/supabase/suppliers';

let seedPromise: Promise<void> | null = null;

function productToRow(product: (typeof SEED_PRODUCTS)[number]) {
  const { id, supplierId, originalPrice, isWholesaleEnabled, minOrderQuantity, maxOrderQuantity, ...rest } =
    product;
  return {
    id,
    ...rest,
    supplier_id: supplierId,
    original_price: originalPrice ?? null,
    is_wholesale_enabled: isWholesaleEnabled,
    min_order_quantity: minOrderQuantity,
    max_order_quantity: maxOrderQuantity,
  };
}

function packageToRow(pkg: (typeof SEED_PACKAGES)[number]) {
  const {
    id,
    supplierId,
    pricingMode,
    basePrice,
    discountedPrice,
    savingsPercentage,
    coverMode,
    coverProductIds,
    isSignature,
    isActive,
    ...rest
  } = pkg;
  return {
    id,
    ...rest,
    supplier_id: supplierId,
    pricing_mode: pricingMode,
    base_price: basePrice,
    discounted_price: discountedPrice,
    savings_percentage: savingsPercentage,
    cover_mode: coverMode ?? null,
    cover_product_ids: coverProductIds ?? null,
    is_signature: isSignature ?? null,
    is_active: isActive,
  };
}

async function runSeed(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await ensureSuppliersReady();

  const { data: settings } = await supabase
    .from(TABLES.settings)
    .select('value')
    .eq('key', 'app')
    .maybeSingle();

  if (settings?.value && (settings.value as { seeded?: boolean }).seeded) {
    return;
  }

  const { count: productCount } = await supabase
    .from(TABLES.products)
    .select('*', { count: 'exact', head: true });

  if (!productCount) {
    const { error } = await supabase.from(TABLES.products).insert(SEED_PRODUCTS.map(productToRow));
    if (error) throw error;
  }

  const { count: packageCount } = await supabase
    .from(TABLES.packages)
    .select('*', { count: 'exact', head: true });

  if (!packageCount) {
    const { error } = await supabase.from(TABLES.packages).insert(SEED_PACKAGES.map(packageToRow));
    if (error) throw error;
  }

  await supabase.from(TABLES.settings).upsert({
    key: 'app',
    value: { seeded: true, seededAt: new Date().toISOString(), version: 1 },
  });
}

export async function ensureDatabaseSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = runSeed().catch((error) => {
    seedPromise = null;
    if (isSupabaseOfflineError(error)) {
      console.warn('[ShiQueen] Supabase offline — skipping database seed.');
      return;
    }
    console.error('[ShiQueen] Database seed failed:', error);
  });

  return seedPromise;
}
