import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LearnStackParamList, Lesson } from '../../types';

type Nav = NativeStackNavigationProp<LearnStackParamList, 'LearnHome'>;

// ── Lesson card component ────────────────────────────────────────────────────
function LessonCard({ lesson, onPress }: { lesson: Lesson; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{lesson.title}</Text>
        <Text style={styles.cardMeta}>{lesson.durationMinutes} min</Text>
      </View>
      {/* Completion indicator would be shown here via lesson completions query */}
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export function LearnHomeScreen() {
  const navigation = useNavigation<Nav>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // TODO: useQuery(LIST_LESSONS) + useQuery(LIST_CATEGORIES)
  const categories: { categoryId: string; name: string }[] = [];
  const lessons: Lesson[] = [];

  // Filter lessons by search and category
  const filtered = lessons.filter((l) => {
    if (selectedCategory && l.categoryId !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.categoryId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group by category for section list
  const sections = categories
    .map((cat) => ({
      title: cat.name,
      data: filtered.filter((l) => l.categoryId === cat.categoryId),
    }))
    .filter((s) => s.data.length > 0);

  return (
    <View style={styles.container}>
      {/* Search */}
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search lessons..."
        placeholderTextColor="#94A3B8"
      />

      {/* Category filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ categoryId: null, name: 'All' }, ...categories]}
        keyExtractor={(item) => item.categoryId || 'all'}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.categoryId && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.categoryId)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item.categoryId && styles.categoryTextActive,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Lessons list */}
      {selectedCategory ? (
        // Flat list when category is selected
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.lessonId}
          renderItem={({ item }) => (
            <LessonCard
              lesson={item}
              onPress={() => navigation.navigate('LessonDetail', { lessonId: item.lessonId })}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No lessons in this category.</Text>}
        />
      ) : (
        // Section list grouped by category
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.lessonId}
          renderItem={({ item }) => (
            <LessonCard
              lesson={item}
              onPress={() => navigation.navigate('LessonDetail', { lessonId: item.lessonId })}
            />
          )}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No lessons available.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchInput: { margin: 16, backgroundColor: '#FFF', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryList: { maxHeight: 44, paddingHorizontal: 16, marginBottom: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#E2E8F0', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#2563EB' },
  categoryText: { fontSize: 13, color: '#475569' },
  categoryTextActive: { color: '#FFF' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginTop: 20, marginBottom: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  cardMeta: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  emptyText: { color: '#94A3B8', textAlign: 'center', marginTop: 40 },
});
