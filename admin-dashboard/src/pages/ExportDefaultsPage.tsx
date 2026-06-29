import React, { useState } from 'react';

export function ExportDefaultsPage() {
  // Per-group export defaults configuration
  const [selectedGroup, setSelectedGroup] = useState('free');
  const [dateRange, setDateRange] = useState('last-12-months');
  const [formatStyle, setFormatStyle] = useState<'SUMMARY' | 'DETAILED'>('DETAILED');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);

  const groups = ['free', 'standard', 'premium'];

  const handleSave = () => {
    // TODO: useMutation(UPDATE_USER_GROUP) with exportDefaults
    alert('Defaults saved for group: ' + selectedGroup);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Export Defaults</h2>
      <p style={{ color: '#64748B', marginBottom: 24 }}>
        Set default export settings for each user group. Users see these defaults when they have no export history.
      </p>

      {/* Group selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setSelectedGroup(g)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: selectedGroup === g ? '#2563EB' : '#E2E8F0',
              background: selectedGroup === g ? '#EFF6FF' : '#FFF',
              color: selectedGroup === g ? '#2563EB' : '#475569',
              cursor: 'pointer',
              fontWeight: selectedGroup === g ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ background: '#FFF', padding: 24, borderRadius: 12 }}>
        <label style={labelStyle}>Date Range Default</label>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={inputStyle}>
          <option value="last-12-months">Last 12 months</option>
          <option value="current-year">Current calendar year</option>
          <option value="all-time">All time</option>
        </select>

        <label style={labelStyle}>Format Style</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['SUMMARY', 'DETAILED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormatStyle(f)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid',
                borderColor: formatStyle === f ? '#2563EB' : '#E2E8F0',
                background: formatStyle === f ? '#EFF6FF' : '#FFF',
                color: formatStyle === f ? '#2563EB' : '#475569',
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <label style={labelStyle}>Included Sections</label>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input type="checkbox" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} />
            Summary Overview
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={includeDetails} onChange={(e) => setIncludeDetails(e.target.checked)} />
            Detailed Activity Log
          </label>
        </div>

        <button onClick={handleSave} style={{ marginTop: 24, padding: '12px 24px', background: '#2563EB', color: '#FFF', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Save Defaults for "{selectedGroup}"
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 16, marginBottom: 4 };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: 10, borderRadius: 6, border: '1px solid #E2E8F0', marginBottom: 4 };
