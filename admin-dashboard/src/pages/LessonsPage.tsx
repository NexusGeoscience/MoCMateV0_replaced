import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LessonSummary {
  lessonId: string;
  title: string;
  categoryId: string;
  durationMinutes: number;
  isPublished: boolean;
}

export function LessonsPage() {
  const navigate = useNavigate();
  // TODO: useQuery(LIST_LESSONS — admin version, includes unpublished)
  const [lessons] = useState<LessonSummary[]>([]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700 }}>Lessons</h2>
        <button
          onClick={() => navigate('/lessons/new')}
          style={{ padding: '10px 20px', background: '#2563EB', color: '#FFF', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          + Create Lesson
        </button>
      </div>

      <div style={{ background: '#FFF', borderRadius: 12, overflow: 'hidden' }}>
        {lessons.length === 0 ? (
          <p style={{ padding: 20, color: '#94A3B8' }}>No lessons created yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>Title</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Category</th>
                <th style={{ padding: 12 }}>Duration</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson) => (
                <tr key={lesson.lessonId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{lesson.title}</td>
                  <td style={{ padding: 12, color: '#64748B' }}>{lesson.categoryId}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{lesson.durationMinutes}m</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: lesson.isPublished ? '#DCFCE7' : '#FEF3C7', color: lesson.isPublished ? '#166534' : '#92400E' }}>
                      {lesson.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <button onClick={() => navigate(`/lessons/${lesson.lessonId}`)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563EB' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
