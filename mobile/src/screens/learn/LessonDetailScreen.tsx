import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearnStackParamList } from '../../types';

type Route = RouteProp<LearnStackParamList, 'LessonDetail'>;
type Nav = NativeStackNavigationProp<LearnStackParamList, 'LessonDetail'>;

export function LessonDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { lessonId } = route.params;

  // TODO: useQuery(GET_LESSON)
  const lesson = {
    lessonId,
    title: 'Sample Lesson',
    description: 'This is a detailed lesson on mining safety protocols.',
    categoryId: 'safety',
    categoryName: 'Safety',
    durationMinutes: 30,
    cpdCreditHours: 1.5,
    structure: 'SCROLLABLE' as const,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.category}>{lesson.categoryName}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Duration</Text>
          <Text style={styles.metaValue}>{lesson.durationMinutes} min</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>CPD Credit</Text>
          <Text style={styles.metaValue}>{lesson.cpdCreditHours}h</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Format</Text>
          <Text style={styles.metaValue}>{lesson.structure === 'SCROLLABLE' ? 'Scroll' : 'Steps'}</Text>
        </View>
      </View>

      <Text style={styles.description}>{lesson.description}</Text>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('LessonContent', { lessonId })}
      >
        <Text style={styles.startButtonText}>Start Lesson</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  category: { fontSize: 13, color: '#2563EB', fontWeight: '500', marginBottom: 20 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  metaItem: { flex: 1, backgroundColor: '#FFF', borderRadius: 10, padding: 12, alignItems: 'center' },
  metaLabel: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  metaValue: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  description: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 32 },
  startButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  startButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
