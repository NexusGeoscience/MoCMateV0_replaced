import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../types';
import { useAuth } from '../../services/auth';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export function ProfileHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout, isPremium } = useAuth();

  return (
    <View style={styles.container}>
      {/* User info */}
      <View style={styles.userCard}>
        <Text style={styles.userName}>{user?.displayName || user?.email}</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{user?.subscriptionTier || 'FREE'}</Text>
        </View>
      </View>

      {/* Menu items */}
      <View style={styles.menu}>
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
  menu: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', marginBottom: 32 },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { fontSize: 15, color: '#334155' },
  logoutButton: { alignItems: 'center', padding: 16 },
  logoutText: { fontSize: 15, color: '#DC2626', fontWeight: '600' },
});
