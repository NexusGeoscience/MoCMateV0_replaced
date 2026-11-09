// ─────────────────────────────────────────────────────────────────────────────
// Subscription: free first month, then one paid App Store / Google Play plan.
//
// The server is the source of truth: it starts each user's trial and checks
// entitlement on every API request. This provider only mirrors that state
// for the UI (paywall, trial countdown) and runs the native store purchase.
// ─────────────────────────────────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { gql } from '@apollo/client';
import * as RNIap from 'react-native-iap';

import { apolloClient, setSubscriptionRequiredHandler } from './apollo';
import { useAuth } from './auth';
import { ENV } from '../config/env';
import { SubscriptionInfo } from '../types';

const SUBSCRIPTION_FIELDS = `
  status
  isEntitled
  trialEndsAt
  expiresAt
  autoRenewing
  platform
  productId
  appAccountToken
`;

const GET_SUBSCRIPTION_STATUS = gql`
  query GetSubscriptionStatus {
    getSubscriptionStatus { ${SUBSCRIPTION_FIELDS} }
  }
`;

const VERIFY_PURCHASE = gql`
  mutation VerifyPurchase($input: VerifyPurchaseInput!) {
    verifyPurchase(input: $input) { ${SUBSCRIPTION_FIELDS} }
  }
`;

export const PRODUCT_ID = Platform.select({
  ios: ENV.IAP_PRODUCT_ID_IOS,
  android: ENV.IAP_PRODUCT_ID_ANDROID,
  default: '',
});

export interface StoreProduct {
  price: string;            // localised, e.g. "A$9.99"
  period: string;           // e.g. "month"
  offerToken?: string;      // Android base-plan offer token
}

interface SubscriptionContextType {
  info: SubscriptionInfo | null;
  isLoading: boolean;
  /** False only when the server has said the trial and subscription have both ended. */
  isEntitled: boolean;
  trialDaysLeft: number | null;
  product: StoreProduct | null;
  isPurchasing: boolean;
  message: string | null;
  refresh: () => Promise<void>;
  subscribe: () => Promise<void>;
  restore: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

function describeProduct(sub: RNIap.Subscription): StoreProduct | null {
  if ('subscriptionOfferDetails' in sub && sub.subscriptionOfferDetails?.length) {
    // Android: one base plan. Use its first (only) pricing phase.
    const offer = sub.subscriptionOfferDetails[0];
    const phase = offer.pricingPhases.pricingPhaseList[0];
    const period = { P1M: 'month', P1Y: 'year', P1W: 'week', P3M: '3 months', P6M: '6 months' }[
      phase?.billingPeriod ?? ''
    ] ?? 'period';
    return { price: phase?.formattedPrice ?? '', period, offerToken: offer.offerToken };
  }
  if ('subscriptionPeriodUnitIOS' in sub) {
    const unit = (sub.subscriptionPeriodUnitIOS ?? 'MONTH').toLowerCase();
    const n = Number(sub.subscriptionPeriodNumberIOS ?? '1');
    return { price: sub.localizedPrice, period: n > 1 ? `${n} ${unit}s` : unit };
  }
  return null;
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [info, setInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const infoRef = useRef<SubscriptionInfo | null>(null);
  infoRef.current = info;

  // ── Server status ──────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_SUBSCRIPTION_STATUS,
        fetchPolicy: 'network-only',
      });
      setInfo(data.getSubscriptionStatus);
    } catch (e) {
      // Offline / server unreachable: keep what we had. The server still
      // refuses data to expired users, so this cannot unlock the app.
      console.warn('Subscription status check failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify = useCallback(async (purchase: RNIap.Purchase) => {
    const { data } = await apolloClient.mutate({
      mutation: VERIFY_PURCHASE,
      variables: {
        input: {
          platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          productId: purchase.productId,
          transactionId: Platform.OS === 'ios' ? purchase.transactionId : undefined,
          purchaseToken: Platform.OS === 'android' ? purchase.purchaseToken : undefined,
        },
      },
    });
    const result: SubscriptionInfo = data.verifyPurchase;
    setInfo(result);
    return result;
  }, []);

  // Load status whenever someone signs in; reset on sign out.
  useEffect(() => {
    if (!isAuthenticated) {
      setInfo(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    refresh();
  }, [isAuthenticated, refresh]);

  // Re-check when the app comes back to the foreground (trial may have ended,
  // or the user may have subscribed / cancelled in the store settings).
  useEffect(() => {
    if (!isAuthenticated) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [isAuthenticated, refresh]);

  // Any API call rejected with "SubscriptionRequired" → re-check (lets the
  // server pick up a renewal), which shows the paywall if access really ended.
  useEffect(() => {
    setSubscriptionRequiredHandler(() => {
      refresh();
    });
    return () => setSubscriptionRequiredHandler(null);
  }, [refresh]);

  // ── Store connection & purchase listeners ─────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !PRODUCT_ID) return;
    let cancelled = false;
    let updateSub: { remove: () => void } | undefined;
    let errorSub: { remove: () => void } | undefined;

    (async () => {
      try {
        await RNIap.initConnection();
        if (Platform.OS === 'android') {
          await RNIap.flushFailedPurchasesCachedAsPendingAndroid().catch(() => undefined);
        }
        const subs = await RNIap.getSubscriptions({ skus: [PRODUCT_ID] });
        if (!cancelled && subs[0]) setProduct(describeProduct(subs[0]));
      } catch (e) {
        console.warn('Store connection failed', e);
      }

      updateSub = RNIap.purchaseUpdatedListener(async (purchase) => {
        if (purchase.productId !== PRODUCT_ID) return;
        try {
          const result = await verify(purchase);
          // Only finish once the server has credited the purchase. Unfinished
          // purchases are re-delivered by the store, so a failed verification
          // (e.g. no signal) is retried on the next launch.
          await RNIap.finishTransaction({ purchase, isConsumable: false });
          if (result.isEntitled) setMessage(null);
        } catch (e) {
          setMessage(e instanceof Error ? e.message : 'Could not confirm your purchase. Please try again.');
        } finally {
          setIsPurchasing(false);
        }
      });

      errorSub = RNIap.purchaseErrorListener((error) => {
        setIsPurchasing(false);
        if (error.code !== RNIap.ErrorCode.E_USER_CANCELLED) {
          setMessage(error.message || 'The purchase could not be completed.');
        }
      });
    })();

    return () => {
      cancelled = true;
      updateSub?.remove();
      errorSub?.remove();
      RNIap.endConnection();
    };
  }, [isAuthenticated, verify]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    const accountToken = infoRef.current?.appAccountToken;
    if (!PRODUCT_ID || !accountToken) {
      setMessage('Subscriptions are not available right now. Please try again later.');
      return;
    }
    setMessage(null);
    setIsPurchasing(true);
    try {
      if (Platform.OS === 'ios') {
        await RNIap.requestSubscription({
          sku: PRODUCT_ID,
          appAccountToken: accountToken,
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
        });
      } else {
        if (!product?.offerToken) throw new Error('Subscription is not available on this device.');
        await RNIap.requestSubscription({
          subscriptionOffers: [{ sku: PRODUCT_ID, offerToken: product.offerToken }],
          obfuscatedAccountIdAndroid: accountToken,
        });
      }
      // Result arrives via purchaseUpdatedListener / purchaseErrorListener.
    } catch (e) {
      setIsPurchasing(false);
      const code = (e as { code?: string }).code;
      if (code !== RNIap.ErrorCode.E_USER_CANCELLED) {
        setMessage(e instanceof Error ? e.message : 'The purchase could not be completed.');
      }
    }
  }, [product]);

  const restore = useCallback(async () => {
    setMessage(null);
    setIsPurchasing(true);
    try {
      const purchases = (await RNIap.getAvailablePurchases()).filter((p) => p.productId === PRODUCT_ID);
      if (purchases.length === 0) {
        setMessage('No previous MoC-mate subscription was found for this store account.');
        return;
      }
      const latest = purchases.sort((a, b) => b.transactionDate - a.transactionDate)[0];
      const result = await verify(latest);
      if (!result.isEntitled) setMessage('Your previous subscription has expired.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not restore purchases.');
    } finally {
      setIsPurchasing(false);
    }
  }, [verify]);

  const trialDaysLeft =
    info?.status === 'TRIAL'
      ? Math.max(0, Math.ceil((new Date(info.trialEndsAt).getTime() - Date.now()) / 86_400_000))
      : null;

  return (
    <SubscriptionContext.Provider
      value={{
        info,
        isLoading,
        isEntitled: info ? info.isEntitled : true,
        trialDaysLeft,
        product,
        isPurchasing,
        message,
        refresh,
        subscribe,
        restore,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
