import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList, ExportPreset } from '../../types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ExportPresets'>;

const MAX_PRESETS = 10;

export function ExportPresetsScreen() {
  const navigation = useNavigation<Nav>();

  // TODO: useQuery(LIST_EXPORT_PRESETS)
  const [presets, setPresets] = useState<ExportPreset[]>([]);

  const handleApply = (preset: ExportPreset) => {
    // Show preview then navigate to export options
    Alert.alert(
      `Apply "${preset.name}"?`,
      `Format: ${preset.formatStyle}\nDate: ${preset.dateRangeStart || 'Any'} — ${preset.dateRangeEnd || 'Any'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => navigation.navigate('ExportOptions', { presetId: preset.presetId }),
        },
      ],
    );
  };

  const handleDelete = (presetId: string) => {
    Alert.alert('Delete Preset', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          // TODO: useMutation(DELETE_EXPORT_PRESET)
          setPresets((p) => p.filter((x) => x.presetId !== presetId));
        },
      },
    ]);
  };

  const renderPreset = ({ item }: { item: ExportPreset }) => (
    <View style={styles.presetCard}>
      <TouchableOpacity style={styles.presetContent} onPress={() => handleApply(item)}>
        <Text style={styles.presetName}>{item.name}</Text>
        <Text style={styles.presetMeta}>{item.formatStyle} · {item.categoryIds?.length || 0} categories</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.presetId)} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {presets.length}/{MAX_PRESETS} presets used
      </Text>

      <FlatList
        data={presets}
        keyExtractor={(item) => item.presetId}
        renderItem={renderPreset}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No export presets saved yet.{'\n'}Create one from the Export screen.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { fontSize: 13, color: '#64748B', padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  presetCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  presetContent: { flex: 1 },
  presetName: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  presetMeta: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 16 },
  empty: { alignItems: 'center', marginTop: 64 },
  emptyText: { color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
});
