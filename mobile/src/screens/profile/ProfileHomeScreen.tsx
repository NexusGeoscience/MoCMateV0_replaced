import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { useAuth } from '../../services/auth';
import { PRODUCT_ID, useSubscription } from '../../services/subscription';
import { ENV } from '../../config/env';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export function ProfileHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { info, trialDaysLeft } = useSubscription();

  const formatDate = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  let badge = 'Free trial';
  let detail = '';
  if (info?.status === 'TRIAL') {
    badge = 'Free trial';
    detail = `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left · ends ${formatDate(info.trialEndsAt)}`;
  } else if (info?.status === 'ACTIVE') {
    badge = 'Subscribed';
    detail = `Renews ${formatDate(info.expiresAt)}`;
  } else if (info?.status === 'CANCELLED') {
    badge = 'Subscribed';
    detail = `Cancelled · access until ${formatDate(info.expiresAt)}`;
  } else if (info?.status === 'GRACE_PERIOD') {
    badge = 'Payment issue';
    detail = 'Please update your payment details in your store account';
  }

  const isPaid = info?.status === 'ACTIVE' || info?.status === 'CANCELLED' || info?.status === 'GRACE_PERIOD';

  const manageSubscription = () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : `https://play.google.com/store/account/subscriptions?sku=${encodeURIComponent(PRODUCT_ID)}&package=${encodeURIComponent(ENV.ANDROID_PACKAGE_NAME)}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* User info */}
      <View style={styles.userCard}>
        <Text style={styles.userName}>{user?.displayName || user?.email}</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{badge}</Text>
        </View>
        {!!detail && <Text style={styles.detailText}>{detail}</Text>}
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
        {isPaid ? (
          <TouchableOpacity style={styles.menuItem} onPress={manageSubscription}>
            <Text style={styles.menuText}>💳 Manage Subscription</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Subscription')}>
            <Text style={styles.menuText}>⭐ Subscribe</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ExportOptions', {})}
        >
          <Text style={styles.menuText}>📄 Export CPD Report</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('ExportPresets')}
        >
          <Text style={styles.menuText}>⚙️ Manage Export Presets</Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  userCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 24 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 8 },
  tierBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  tierText: { fontSize: 12, fontWeight: '600', color: '#2563EB' },
  detailText: { fontSize: 13, color: '#64748B', marginTop: 8 },
  menu: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', marginBottom: 32 },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { fontSize: 15, color: '#334155' },
  logoutButton: { alignItems: 'center', padding: 16 },
  logoutText: { fontSize: 15, color: '#DC2626', fontWeight: '600' },
});
