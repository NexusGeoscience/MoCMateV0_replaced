import React from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ENV } from '../config/env';
import { useAuth } from '../services/auth';
import { useSubscription } from '../services/subscription';

const FEATURES = [
  'Log and track all your CPD activities',
  'Save drafts and pick up where you left off',
  'Export CPD reports as PDF',
  'Learn: eLearning lessons that log CPD automatically',
];

/**
 * Shown full-screen once the free month has ended (`locked`), and from
 * Profile › Subscription so trial users can subscribe early.
 */
export function PaywallScreen({ locked = false }: { locked?: boolean }) {
  const { logout } = useAuth();
  const { product, isPurchasing, message, subscribe, restore, trialDaysLeft } = useSubscription();

  const priceLine = product ? `${product.price} per ${product.period}` : null;
  const store = Platform.OS === 'ios' ? 'Apple ID' : 'Google Play';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{locked ? 'Your free month has ended' : 'MoC-mate subscription'}</Text>
      <Text style={styles.subtitle}>
        {locked
          ? 'Subscribe to keep using MoC-mate. Your CPD records are safe and will be waiting for you.'
          : trialDaysLeft !== null
            ? `You have ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free month. Subscribe any time to keep access when it ends.`
            : 'One subscription unlocks everything in MoC-mate.'}
      </Text>

      <View style={styles.card}>
        {FEATURES.map((f) => (
          <Text key={f} style={styles.feature}>✓  {f}</Text>
        ))}
      </View>

      {priceLine ? (
        <Text style={styles.price}>{priceLine}</Text>
      ) : (
        <ActivityIndicator style={styles.priceLoading} />
      )}

      <TouchableOpacity
        style={[styles.button, (isPurchasing || !product) && styles.buttonDisabled]}
        onPress={subscribe}
        disabled={isPurchasing || !product}
      >
        {isPurchasing ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Subscribe</Text>
        )}
      </TouchableOpacity>

      {message && <Text style={styles.message}>{message}</Text>}

      <TouchableOpacity onPress={restore} disabled={isPurchasing} style={styles.link}>
        <Text style={styles.linkText}>Restore purchases</Text>
      </TouchableOpacity>

      <Text style={styles.legal}>
        {priceLine ? `${priceLine}. ` : ''}Payment is charged to your {store} account. The subscription
        renews automatically unless cancelled at least 24 hours before the end of the current period.
        Manage or cancel any time in your {store} account settings.
      </Text>

      <View style={styles.legalLinks}>
        {!!ENV.TERMS_URL && (
          <Text style={styles.legalLink} onPress={() => Linking.openURL(ENV.TERMS_URL)}>
            Terms of Use
          </Text>
        )}
        {!!ENV.PRIVACY_URL && (
          <Text style={styles.legalLink} onPress={() => Linking.openURL(ENV.PRIVACY_URL)}>
            Privacy Policy
          </Text>
        )}
      </View>

      {locked && (
        <TouchableOpacity onPress={logout} style={styles.link}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 26, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 24 },
  feature: { fontSize: 15, color: '#334155', paddingVertical: 6 },
  price: { fontSize: 20, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 16 },
  priceLoading: { marginBottom: 16 },
  button: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  message: { color: '#DC2626', textAlign: 'center', marginTop: 12 },
  link: { alignItems: 'center', padding: 14 },
  linkText: { color: '#2563EB', fontSize: 15, fontWeight: '600' },
  legal: { fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16, marginTop: 8 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 8 },
  legalLink: { fontSize: 12, color: '#2563EB' },
  signOut: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
});
