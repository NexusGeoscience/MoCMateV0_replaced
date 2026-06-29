import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CpdStackParamList } from '../../types';

type Route = RouteProp<CpdStackParamList, 'ActivityDetail'>;
type Nav = NativeStackNavigationProp<CpdStackParamList, 'ActivityDetail'>;

export function ActivityDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { activityId } = route.params;

  // TODO: Fetch activity via useQuery(GET_CPD_ACTIVITY, { variables: { activityId } })
  const activity = {
    activityId,
    name: 'Sample Activity',
    description: 'Description here',
    categoryId: 'cat-1',
    activityDate: '2024-06-15',
    hours: 2.5,
    isLocked: false,
    sourceLesson: undefined as string | undefined,
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  };

  const handleDelete = () => {
    if (activity.isLocked) return;
    Alert.alert(
      'Delete Activity',
      'Are you sure you want to delete this activity? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: useMutation(DELETE_CPD_ACTIVITY)
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate('ActivityForm', { activityId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Lock indicator */}
      {activity.isLocked && (
        <View style={styles.lockBanner}>
          <Text style={styles.lockBannerText}>
            🔒 This entry was auto-logged from a lesson and cannot be modified.
          </Text>
        </View>
      )}

      <Text style={styles.name}>{activity.name}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.value}>{activity.activityDate}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Hours</Text>
        <Text style={styles.value}>{activity.hours}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.value}>{activity.categoryId}</Text>
      </View>

      {activity.description ? (
        <View style={styles.descriptionBlock}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.description}>{activity.description}</Text>
        </View>
      ) : null}

      {/* Action buttons */}
      {!activity.isLocked && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20 },
  lockBanner: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 12, marginBottom: 16 },
  lockBannerText: { color: '#92400E', fontSize: 13 },
  name: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  label: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  value: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  descriptionBlock: { marginTop: 16 },
  description: { fontSize: 14, color: '#334155', marginTop: 4, lineHeight: 20 },
  actions: { flexDirection: 'row', marginTop: 32, gap: 12 },
  editButton: { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  editButtonText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  deleteButton: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  deleteButtonText: { color: '#DC2626', fontWeight: '600', fontSize: 16 },
});
