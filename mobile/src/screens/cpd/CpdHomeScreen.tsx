import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CpdStackParamList, CpdActivity, Draft } from '../../types';

type Nav = NativeStackNavigationProp<CpdStackParamList, 'CpdHome'>;

// ── Drafts collapsed section ─────────────────────────────────────────────────
function DraftsSection({ drafts }: { drafts: Draft[] }) {
  const navigation = useNavigation<Nav>();
  const [expanded, setExpanded] = useState(false);
  const visibleDrafts = expanded ? drafts.slice(0, 3) : drafts.slice(0, 2);

  if (drafts.length === 0) return null;

  return (
    <View style={styles.draftsSection}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.draftsHeader}
      >
        <Text style={styles.draftsTitle}>Drafts ({drafts.length})</Text>
        <Text style={styles.seeAll} onPress={() => navigation.navigate('Drafts')}>
          See all
        </Text>
      </TouchableOpacity>
      {visibleDrafts.map((draft) => (
        <TouchableOpacity
          key={draft.draftId}
          style={styles.draftRow}
          onPress={() => navigation.navigate('ActivityForm', { draftId: draft.draftId })}
        >
          <Text style={styles.draftName}>{draft.name || 'Untitled draft'}</Text>
          <Text style={styles.draftDate}>{draft.savedAt?.split('T')[0]}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Activity row ─────────────────────────────────────────────────────────────
function ActivityRow({ item, onPress }: { item: CpdActivity; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.activityRow} onPress={onPress}>
      <View style={styles.activityRowLeft}>
        <Text style={styles.activityName}>{item.name}</Text>
        <Text style={styles.activityDate}>{item.activityDate}</Text>
      </View>
      <Text style={styles.activityHours}>{item.hours}h</Text>
      {item.isLocked && <Text style={styles.lockIcon}>🔒</Text>}
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export function CpdHomeScreen() {
  const navigation = useNavigation<Nav>();
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'category' | 'hours'>('recent');

  // TODO: Replace with real GraphQL hooks
  const drafts: Draft[] = [];
  const activities: CpdActivity[] = [];

  const handleFABPress = useCallback(() => {
    if (drafts.length > 0) {
      Alert.alert(
        'New Activity',
        'You have drafts in progress.',
        [
          { text: 'Resume a draft', onPress: () => navigation.navigate('Drafts') },
          { text: 'Start new', onPress: () => navigation.navigate('ActivityForm', {}) },
        ],
        { cancelable: true },
      );
    } else {
      navigation.navigate('ActivityForm', {});
    }
  }, [drafts.length, navigation]);

  return (
    <View style={styles.container}>
      {/* Header with export shortcut */}
      <View style={styles.headerRow}>
        <Text style={styles.heading}>My CPD</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExportOptions', {})}>
          <Text style={styles.exportButton}>📄 Export</Text>
        </TouchableOpacity>
      </View>

      {/* Drafts */}
      <DraftsSection drafts={drafts} />

      {/* Divider */}
      {drafts.length > 0 && <View style={styles.divider} />}

      {/* Sort toggle */}
      <View style={styles.sortRow}>
        {(['recent', 'oldest', 'category', 'hours'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity list */}
      <FlatList
        data={activities}
        keyExtractor={(item) => item.activityId}
        renderItem={({ item }) => (
          <ActivityRow
            item={item}
            onPress={() => navigation.navigate('ActivityDetail', { activityId: item.activityId })}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No activities logged yet.{'\n'}Tap + to get started.</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleFABPress}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 8 },
  heading: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
  exportButton: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  draftsSection: { marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8 },
  draftsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  draftsTitle: { fontSize: 14, fontWeight: '600', color: '#475569' },
  seeAll: { fontSize: 13, color: '#2563EB' },
  draftRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  draftName: { fontSize: 14, color: '#334155' },
  draftDate: { fontSize: 12, color: '#94A3B8' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginHorizontal: 16, marginVertical: 8 },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E2E8F0' },
  sortChipActive: { backgroundColor: '#2563EB' },
  sortText: { fontSize: 12, color: '#475569' },
  sortTextActive: { color: '#FFF' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  activityRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  activityRowLeft: { flex: 1 },
  activityName: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  activityDate: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  activityHours: { fontSize: 14, fontWeight: '600', color: '#2563EB', marginRight: 8 },
  lockIcon: { fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 64 },
  emptyText: { color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  fabText: { fontSize: 28, color: '#FFF', marginTop: -2 },
});
