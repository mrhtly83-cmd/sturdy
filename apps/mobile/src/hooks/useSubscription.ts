// src/hooks/useSubscription.ts
//
// Real RevenueCat subscription hook.
// Replaces the mock — same { isPremium, plan, purchase, restore } interface.
// Every existing call site works without changes.

import { useEffect, useState, useCallback } from 'react';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
} from 'react-native-purchases';

const ENTITLEMENT_ID = 'sturdy_plus';

type Plan = 'free' | 'monthly' | 'annual';

function planFromCustomerInfo(info: CustomerInfo): Plan {
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  if (!entitlement) return 'free';

  // RevenueCat productIdentifier contains the product id you set in Play Console
  const productId = entitlement.productIdentifier ?? '';
  if (productId.includes('annual') || productId.includes('yearly')) return 'annual';
  return 'monthly';
}

export const useSubscription = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [plan, setPlan] = useState<Plan>('free');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current customer info + available packages
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        if (cancelled) return;

        const hasAccess = !!info.entitlements.active[ENTITLEMENT_ID];
        setIsPremium(hasAccess);
        setPlan(planFromCustomerInfo(info));

        const offerings = await Purchases.getOfferings();
        if (cancelled) return;

        if (offerings.current?.availablePackages) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (err) {
        console.warn('[BILLING] Failed to load subscription info:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    // Listen for subscription changes (renewals, cancellations, etc.)
    const customerInfoUpdated = (info: CustomerInfo) => {
      const hasAccess = !!info.entitlements.active[ENTITLEMENT_ID];
      setIsPremium(hasAccess);
      setPlan(planFromCustomerInfo(info));
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdated);

    return () => {
      cancelled = true;
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdated);
    };
  }, []);

  const purchase = useCallback(
    async (packageType?: 'monthly' | 'annual') => {
      try {
        // Find the right package — default to monthly if not specified
        let pkg = packages[0];
        if (packageType && packages.length > 0) {
          const match = packages.find((p) =>
            packageType === 'annual'
              ? p.packageType === 'ANNUAL' ||
                p.identifier.toLowerCase().includes('annual') ||
                p.identifier.toLowerCase().includes('yearly')
              : p.packageType === 'MONTHLY' ||
                p.identifier.toLowerCase().includes('monthly'),
          );
          if (match) pkg = match;
        }

        if (!pkg) {
          console.warn('[BILLING] No packages available');
          return;
        }

        const { customerInfo } = await Purchases.purchasePackage(pkg);
        const hasAccess = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
        setIsPremium(hasAccess);
        setPlan(planFromCustomerInfo(customerInfo));
      } catch (err: any) {
        if (err.userCancelled) {
          // User cancelled — not an error
          return;
        }
        console.error('[BILLING] Purchase failed:', err);
        throw err;
      }
    },
    [packages],
  );

  const restore = useCallback(async () => {
    try {
      const info = await Purchases.restorePurchases();
      const hasAccess = !!info.entitlements.active[ENTITLEMENT_ID];
      setIsPremium(hasAccess);
      setPlan(planFromCustomerInfo(info));
      return hasAccess;
    } catch (err) {
      console.error('[BILLING] Restore failed:', err);
      throw err;
    }
  }, []);

  return { isPremium, plan, purchase, restore, packages, isLoading };
};