import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ExportFormatStyle } from '../../types';

type RouteParams = { presetId?: string };

export function ExportOptionsScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ ExportOptions: RouteParams }, 'ExportOptions'>>();
  const { presetId } = route.params || {};

  // Export settings state
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [formatStyle, setFormatStyle] = useState<ExportFormatStyle>(ExportFormatStyle.DETAILED);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [activePresetName, setActivePresetName] = useState<string | null>(null);
  const [hasChanged, setHasChanged] = useState(false);

  // TODO: Load preset defaults or group defaults on mount

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      // TODO: useMutation(EXPORT_CPD_REPORT) -> returns downloadUrl
      // Simulate export
      await new Promise((r) => setTimeout(r, 2000));

      // Open native share sheet with the download URL
      const url = 'https://example.com/report.pdf';
      if (await Sharing.isAvailableAsync()) {
        // In production: download file first, then share local file URI
        Alert.alert('Export Ready', 'Your CPD report has been generated.');
      }
    } catch (err) {
      Alert.alert('Export Failed', 'Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [dateStart, dateEnd, formatStyle, includeSummary, includeDetails]);

  const handleSavePreset = () => {
    Alert.prompt(
      'Save as Preset',
      'Enter a name for this preset:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (presetName) => {
            if (!presetName?.trim()) return;
            // TODO: useMutation(CREATE_EXPORT_PRESET) with duplicate name validation
            setActivePresetName(presetName);
            setHasChanged(false);
          },
        },
      ],
      'plain-text',
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Active preset label */}
      {activePresetName && (
        <Text style={styles.presetLabel}>Preset: {activePresetName}</Text>
      )}

      {/* Date range */}
      <Text style={styles.sectionTitle}>Date Range</Text>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={dateStart}
          onChangeText={(v) => { setDateStart(v); setHasChanged(true); }}
          placeholder="Start (YYYY-MM-DD)"
        />
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={dateEnd}
          onChangeText={(v) => { setDateEnd(v); setHasChanged(true); }}
          placeholder="End (YYYY-MM-DD)"
        />
      </View>

      {/* Format style */}
      <Text style={styles.sectionTitle}>Format</Text>
      <View style={styles.formatRow}>
        <TouchableOpacity
          style={[styles.formatOption, formatStyle === ExportFormatStyle.SUMMARY && styles.formatActive]}
          onPress={() => { setFormatStyle(ExportFormatStyle.SUMMARY); setHasChanged(true); }}
        >
          <Text style={[styles.formatText, formatStyle === ExportFormatStyle.SUMMARY && styles.formatTextActive]}>
            Summary
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formatOption, formatStyle === ExportFormatStyle.DETAILED && styles.formatActive]}
          onPress={() => { setFormatStyle(ExportFormatStyle.DETAILED); setHasChanged(true); }}
        >
          <Text style={[styles.formatText, formatStyle === ExportFormatStyle.DETAILED && styles.formatTextActive]}>
            Detailed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sections toggle */}
      <Text style={styles.sectionTitle}>Sections</Text>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Summary Overview</Text>
        <Switch value={includeSummary} onValueChange={(v) => { setIncludeSummary(v); setHasChanged(true); }} />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Detailed Log</Text>
        <Switch value={includeDetails} onValueChange={(v) => { setIncludeDetails(v); setHasChanged(true); }} />
      </View>

      {/* Save as preset */}
      {hasChanged && (
        <TouchableOpacity style={styles.savePresetBtn} onPress={handleSavePreset}>
          <Text style={styles.savePresetText}>Save as Preset</Text>
        </TouchableOpacity>
      )}

      {/* Export button */}
      <TouchableOpacity
        style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
        onPress={handleExport}
        disabled={isExporting}
      >
        {isExporting ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.exportBtnText}>Generate & Share Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 40 },
  presetLabel: { fontSize: 12, color: '#64748B', marginBottom: 12, fontStyle: 'italic' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 20, marginBottom: 8 },
  dateRow: { flexDirection: 'row', gap: 8 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  dateInput: { flex: 1 },
  formatRow: { flexDirection: 'row', gap: 8 },
  formatOption: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  formatActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  formatText: { fontSize: 14, color: '#475569' },
  formatTextActive: { color: '#2563EB', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  toggleLabel: { fontSize: 14, color: '#334155' },
  savePresetBtn: { marginTop: 16, borderWidth: 1, borderColor: '#2563EB', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  savePresetText: { color: '#2563EB', fontWeight: '600' },
  exportBtn: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  exportBtnDisabled: { opacity: 0.6 },
  exportBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
