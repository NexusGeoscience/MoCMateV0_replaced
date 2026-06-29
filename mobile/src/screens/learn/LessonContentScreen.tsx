import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LearnStackParamList, ContentBlock, ContentType, LessonStructure } from '../../types';

type Route = RouteProp<LearnStackParamList, 'LessonContent'>;

// ── Content block renderers ──────────────────────────────────────────────────
function TextBlock({ block }: { block: ContentBlock }) {
  return (
    <View style={styles.textBlock}>
      {block.title && <Text style={styles.blockTitle}>{block.title}</Text>}
      <Text style={styles.blockBody}>{block.body}</Text>
    </View>
  );
}

function VideoBlock({ block }: { block: ContentBlock }) {
  return (
    <View style={styles.videoBlock}>
      {block.title && <Text style={styles.blockTitle}>{block.title}</Text>}
      {/* TODO: Replace with react-native-video or expo-video */}
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoPlaceholderText}>▶ Video: {block.videoUrl}</Text>
      </View>
    </View>
  );
}

function QuizBlock({ block, onAnswer }: { block: ContentBlock; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const question = block.questions?.[0]; // For stepped, one question at a time

  if (!question) return null;

  const handleSelect = (idx: number) => {
    setSelected(idx);
    onAnswer(idx === question.answerIndex);
  };

  return (
    <View style={styles.quizBlock}>
      <Text style={styles.quizQuestion}>{question.text}</Text>
      {question.options.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={[
            styles.quizOption,
            selected === idx && (idx === question.answerIndex ? styles.quizCorrect : styles.quizIncorrect),
          ]}
          onPress={() => handleSelect(idx)}
          disabled={selected !== null}
        >
          <Text style={styles.quizOptionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export function LessonContentScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { lessonId } = route.params;

  // TODO: useQuery(GET_LESSON) with contentBlocks
  const structure: LessonStructure = LessonStructure.SCROLLABLE;
  const contentBlocks: ContentBlock[] = [];
  const [currentStep, setCurrentStep] = useState(0);

  const handleComplete = () => {
    // TODO: useMutation(COMPLETE_LESSON) → triggers cpd-auto-log Lambda
    Alert.alert(
      '🎉 Lesson Complete!',
      'This lesson has been logged to your CPD record.',
      [{ text: 'OK', onPress: () => navigation.goBack() }],
    );
  };

  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case ContentType.TEXT:
        return <TextBlock key={block.blockId} block={block} />;
      case ContentType.VIDEO:
        return <VideoBlock key={block.blockId} block={block} />;
      case ContentType.QUIZ:
        return <QuizBlock key={block.blockId} block={block} onAnswer={() => {}} />;
      default:
        return null;
    }
  };

  if (structure === LessonStructure.STEPPED) {
    // Stepped: show one block at a time
    const currentBlock = contentBlocks[currentStep];
    const isLast = currentStep >= contentBlocks.length - 1;

    return (
      <View style={styles.container}>
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            Step {currentStep + 1} of {contentBlocks.length}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {currentBlock && renderBlock(currentBlock)}
        </ScrollView>
        <View style={styles.navRow}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentStep((s) => s - 1)}>
              <Text style={styles.navBtnText}>← Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary]}
            onPress={() => (isLast ? handleComplete() : setCurrentStep((s) => s + 1))}
          >
            <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>
              {isLast ? 'Complete' : 'Next →'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Scrollable: show all blocks
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {contentBlocks.map(renderBlock)}
      </ScrollView>
      <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
        <Text style={styles.completeBtnText}>Mark as Complete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingBottom: 100 },
  stepIndicator: { paddingVertical: 12, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  stepText: { fontSize: 13, color: '#64748B' },
  textBlock: { marginBottom: 24 },
  blockTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
  blockBody: { fontSize: 15, color: '#475569', lineHeight: 22 },
  videoBlock: { marginBottom: 24 },
  videoPlaceholder: { backgroundColor: '#1E293B', borderRadius: 10, height: 200, justifyContent: 'center', alignItems: 'center' },
  videoPlaceholderText: { color: '#FFF' },
  quizBlock: { marginBottom: 24 },
  quizQuestion: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  quizOption: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 14, marginBottom: 8 },
  quizCorrect: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  quizIncorrect: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  quizOptionText: { fontSize: 14, color: '#334155' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  navBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, backgroundColor: '#E2E8F0' },
  navBtnPrimary: { backgroundColor: '#2563EB' },
  navBtnText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  navBtnTextPrimary: { color: '#FFF' },
  completeBtn: { position: 'absolute', bottom: 24, left: 20, right: 20, backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  completeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
