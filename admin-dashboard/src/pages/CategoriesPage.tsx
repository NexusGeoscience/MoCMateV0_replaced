import React, { useState } from 'react';

interface Category {
  categoryId: string;
  name: string;
  description: string;
  sortOrder: number;
}

export function CategoriesPage() {
  // TODO: useQuery(LIST_CATEGORIES), useMutation(CREATE/UPDATE/DELETE_CATEGORY)
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    // TODO: Mutation
    setNewName('');
    setNewDesc('');
  };

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>CPD Categories</h2>

      {/* Create form */}
      <div style={{ background: '#FFF', padding: 20, borderRadius: 12, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>New Category</h3>
        <input
          placeholder="Category name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ display: 'block', width: '100%', padding: 10, marginBottom: 8, borderRadius: 6, border: '1px solid #E2E8F0' }}
        />
        <input
          placeholder="Description (optional)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          style={{ display: 'block', width: '100%', padding: 10, marginBottom: 12, borderRadius: 6, border: '1px solid #E2E8F0' }}
        />
        <button onClick={handleCreate} style={{ padding: '10px 20px', background: '#2563EB', color: '#FFF', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Create Category
        </button>
      </div>

      {/* Category list */}
      <div style={{ background: '#FFF', borderRadius: 12, overflow: 'hidden' }}>
        {categories.length === 0 ? (
          <p style={{ padding: 20, color: '#94A3B8' }}>No categories yet. Create one above.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ textAlign: 'left', padding: 12 }}>Name</th>
                <th style={{ textAlign: 'left', padding: 12 }}>Description</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.categoryId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{cat.name}</td>
                  <td style={{ padding: 12, color: '#64748B' }}>{cat.description}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <button style={{ marginRight: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563EB' }}>Edit</button>
                    <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#DC2626' }}>Delete</button>
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
