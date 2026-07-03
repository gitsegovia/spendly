import { supabase } from '../supabase/client';

/**
 * Capa de compras desacoplada del proveedor.
 *
 * Hoy solo existe MockPurchases (sin cuentas de developer no hay IAP posible).
 * Cuando estén las cuentas de App Store / Play Console + RevenueCat:
 *   1. Crear RevenueCatPurchases implementando PurchasesProvider
 *      (purchasePremium → Purchases.purchasePackage, restore → Purchases.restorePurchases).
 *   2. Cambiar el export de `purchases` al provider real.
 *   3. Mover la escritura de profiles.plan al webhook de RevenueCat y revocar
 *      el permiso de UPDATE sobre `plan` en la RLS.
 * Nada más de la app debería tocarse.
 */

export interface PurchaseResult {
  success: boolean;
  /** Clave i18n del error, si lo hubo */
  errorKey?: string;
}

export interface PurchasesProvider {
  /** true si las compras son simuladas (sin pasar por una store real) */
  readonly isSimulated: boolean;
  purchasePremium(userId: string): Promise<PurchaseResult>;
  restorePurchases(userId: string): Promise<PurchaseResult>;
}

// Simula la latencia de una store real para que la UI se pruebe con estados reales
const FAKE_STORE_DELAY_MS = 1200;

async function setPlan(userId: string, plan: 'free' | 'premium'): Promise<PurchaseResult> {
  const { error } = await supabase
    .from('profiles')
    .update({ plan })
    .eq('id', userId);
  if (error) {
    console.error('[Purchases] Error actualizando plan:', error.message);
    return { success: false, errorKey: 'premium.purchase_error' };
  }
  return { success: true };
}

const MockPurchases: PurchasesProvider = {
  isSimulated: true,

  async purchasePremium(userId: string): Promise<PurchaseResult> {
    await new Promise((r) => setTimeout(r, FAKE_STORE_DELAY_MS));
    return setPlan(userId, 'premium');
  },

  async restorePurchases(userId: string): Promise<PurchaseResult> {
    await new Promise((r) => setTimeout(r, FAKE_STORE_DELAY_MS));
    const { data, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();
    if (error) return { success: false, errorKey: 'premium.purchase_error' };
    if (data?.plan !== 'premium') return { success: false, errorKey: 'premium.nothing_to_restore' };
    return { success: true };
  },
};

/** Solo para el toggle de desarrollo en Settings — no usar en flujo de usuario */
export async function devSetPlan(userId: string, plan: 'free' | 'premium'): Promise<PurchaseResult> {
  return setPlan(userId, plan);
}

export const purchases: PurchasesProvider = MockPurchases;
