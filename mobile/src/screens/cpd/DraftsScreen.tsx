import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CpdStackParamList, Draft } from '../../types';

type Nav = NativeStackNavigationProp<CpdStackParamList, 'Drafts'>;

export function DraftsScreen() {
  const navigation = useNavigation<Nav>();

  // TODO: useQuery(LIST_DRAFTS)
  const drafts: Draft[] = [];

  const handleDelete = (draftId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: useMutation(DELETE_DRAFT)
          },
        },
      ],
    );
  };

  const renderDraft = ({ item }: { item: Draft }) => (
    <View style={styles.draftCard}>
      <TouchableOpacity
        style={styles.draftContent}
        onPress={() => navigation.navigate('ActivityForm', { draftId: item.draftId })}
      >
        <Text style={styles.draftName}>{item.name || 'Untitled draft'}</Text>
        <Text style={styles.draftMeta}>
          {item.categoryId ? `${item.categoryId} · ` : ''}{item.activityDate || 'No date'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item.draftId)} style={styles.deleteBtn}>
        <Text style={styles.deleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={drafts}
        keyExtractor={(item) => item.draftId}
        renderItem={renderDraft}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No drafts saved.</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.newButton}
        onPress={() => navigation.navigate('ActivityForm', {})}
      >
        <Text style={styles.newButtonText}>New Activity</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  list: { padding: 16, paddingBottom: 80 },
  draftCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8 },
  draftContent: { flex: 1 },
  draftName: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  draftMeta: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  deleteBtn: { padding: 8 },
  deleteText: { fontSize: 18, color: '#DC2626' },
  empty: { alignItems: 'center', marginTop: 64 },
  emptyText: { color: '#94A3B8' },
  newButton: { position: 'absolute', bottom: 24, left: 24, right: 24, backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  newButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
