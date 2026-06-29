import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

type LessonStructure = 'SCROLLABLE' | 'STEPPED';
type ContentType = 'VIDEO' | 'TEXT' | 'QUIZ';

interface ContentBlockDraft {
  id: string;
  type: ContentType;
  order: number;
  title: string;
  body: string;
  videoUrl: string;
}

export function LessonEditorPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!lessonId;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [cpdCreditHours, setCpdCreditHours] = useState('');
  const [structure, setStructure] = useState<LessonStructure>('SCROLLABLE');
  const [contentBlocks, setContentBlocks] = useState<ContentBlockDraft[]>([]);

  // TODO: If editing, load existing lesson data

  const addBlock = (type: ContentType) => {
    const newBlock: ContentBlockDraft = {
      id: `block-${Date.now()}`,
      type,
      order: contentBlocks.length,
      title: '',
      body: '',
      videoUrl: '',
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const updateBlock = (id: string, field: keyof ContentBlockDraft, value: string) => {
    setContentBlocks(contentBlocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const removeBlock = (id: string) => {
    setContentBlocks(contentBlocks.filter((b) => b.id !== id));
  };

  const handleSave = () => {
    // TODO: useMutation(CREATE_LESSON or UPDATE_LESSON)
    navigate('/lessons');
  };

  const handlePublish = () => {
    // TODO: useMutation(PUBLISH_LESSON)
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
        {isEditing ? 'Edit Lesson' : 'Create Lesson'}
      </h2>

      <div style={{ background: '#FFF', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <label style={labelStyle}>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Lesson title" />

        <label style={labelStyle}>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 80 }} placeholder="Brief description" />

        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Category</label>
            <input value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={inputStyle} placeholder="Category ID" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Duration (minutes)</label>
            <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>CPD Credit (hours)</label>
            <input type="number" step="0.5" value={cpdCreditHours} onChange={(e) => setCpdCreditHours(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <label style={labelStyle}>Structure</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['SCROLLABLE', 'STEPPED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStructure(s)}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid', borderColor: structure === s ? '#2563EB' : '#E2E8F0', background: structure === s ? '#EFF6FF' : '#FFF', color: structure === s ? '#2563EB' : '#475569', cursor: 'pointer', fontWeight: structure === s ? 600 : 400 }}
            >
              {s === 'SCROLLABLE' ? 'Scrollable' : 'Stepped'}
            </button>
          ))}
        </div>
      </div>

      {/* Content blocks editor */}
      <div style={{ background: '#FFF', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Content Blocks</h3>

        {contentBlocks.map((block) => (
          <div key={block.id} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: '#2563EB' }}>{block.type}</span>
              <button onClick={() => removeBlock(block.id)} style={{ background: 'transparent', border: 'none', color: '#DC2626', cursor: 'pointer' }}>Remove</button>
            </div>
            <input
              placeholder="Block title"
              value={block.title}
              onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
              style={inputStyle}
            />
            {block.type === 'TEXT' && (
              <textarea
                placeholder="Text content"
                value={block.body}
                onChange={(e) => updateBlock(block.id, 'body', e.target.value)}
                style={{ ...inputStyle, minHeight: 100 }}
              />
            )}
            {block.type === 'VIDEO' && (
              <input
                placeholder="Video S3 key or URL"
                value={block.videoUrl}
                onChange={(e) => updateBlock(block.id, 'videoUrl', e.target.value)}
                style={inputStyle}
              />
            )}
            {block.type === 'QUIZ' && (
              <p style={{ color: '#94A3B8', fontSize: 13 }}>Quiz editor: add questions via JSON for now</p>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => addBlock('TEXT')} style={addBtnStyle}>+ Text</button>
          <button onClick={() => addBlock('VIDEO')} style={addBtnStyle}>+ Video</button>
          <button onClick={() => addBlock('QUIZ')} style={addBtnStyle}>+ Quiz</button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={handleSave} style={{ padding: '12px 24px', background: '#2563EB', color: '#FFF', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {isEditing ? 'Save Changes' : 'Create Lesson'}
        </button>
        {isEditing && (
          <button onClick={handlePublish} style={{ padding: '12px 24px', background: '#22C55E', color: '#FFF', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            Publish
          </button>
        )}
        <button onClick={() => navigate('/lessons')} style={{ padding: '12px 24px', background: '#F1F5F9', color: '#475569', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 16, marginBottom: 4 };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0', marginBottom: 4, fontSize: 14 };
const addBtnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, border: '1px dashed #CBD5E1', background: '#F8FAFC', cursor: 'pointer', color: '#475569' };
