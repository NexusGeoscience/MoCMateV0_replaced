import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CpdStackParamList } from '../../types';

type Route = RouteProp<CpdStackParamList, 'ActivityForm'>;
type Nav = NativeStackNavigationProp<CpdStackParamList, 'ActivityForm'>;

export function ActivityFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { draftId, activityId } = route.params || {};
  const isEditing = !!activityId;

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // TODO: Load draft or activity data on mount
  useEffect(() => {
    if (draftId) {
      // Load draft from GraphQL
    } else if (activityId) {
      // Load existing activity for editing
    }
  }, [draftId, activityId]);

  // Warn on leaving with unsaved changes
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, isDirty]);

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !hours || !categoryId) {
      Alert.alert('Incomplete', 'Please fill in activity name, category, and hours.');
      return;
    }

    Alert.alert(
      isEditing ? 'Save Changes' : 'Log Activity',
      isEditing ? 'Save your changes to this activity?' : 'Submit this CPD activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // TODO: useMutation(CREATE_CPD_ACTIVITY or UPDATE_CPD_ACTIVITY)
            setIsDirty(false);
            // Navigate to detail screen after creation
            navigation.navigate('ActivityDetail', { activityId: activityId || 'new-id' });
          },
        },
      ],
    );
  }, [name, hours, categoryId, isEditing, activityId, navigation]);

  const handleSaveDraft = useCallback(() => {
    // TODO: useMutation(SAVE_DRAFT)
    Alert.alert('Draft Saved', 'Your progress has been saved.');
    setIsDirty(false);
    navigation.goBack();
  }, [navigation]);

  const markDirty = () => setIsDirty(true);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.form}>
        {/* Name */}
        <Text style={styles.label}>Activity Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(v) => { setName(v); markDirty(); }}
          placeholder="e.g. Safety Conference 2024"
        />

        {/* Category */}
        <Text style={styles.label}>Category *</Text>
        <TextInput
          style={styles.input}
          value={categoryId}
          onChangeText={(v) => { setCategoryId(v); markDirty(); }}
          placeholder="Select category"
        />

        {/* Date */}
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={activityDate}
          onChangeText={(v) => { setActivityDate(v); markDirty(); }}
          placeholder="YYYY-MM-DD"
        />

        {/* Hours */}
        <Text style={styles.label}>CPD Hours *</Text>
        <TextInput
          style={styles.input}
          value={hours}
          onChangeText={(v) => { setHours(v); markDirty(); }}
          placeholder="e.g. 2.5"
          keyboardType="decimal-pad"
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={(v) => { setDescription(v); markDirty(); }}
          placeholder="Brief description of the activity"
          multiline
          numberOfLines={4}
        />

        {/* Actions */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>{isEditing ? 'Save Changes' : 'Log Activity'}</Text>
        </TouchableOpacity>

        {!isEditing && (
          <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft}>
            <Text style={styles.draftText}>Save as Draft</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  form: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1E293B' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  draftButton: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  draftText: { color: '#475569', fontSize: 15, fontWeight: '600' },
});
