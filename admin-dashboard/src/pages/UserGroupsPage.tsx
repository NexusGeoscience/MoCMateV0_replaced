import React, { useState } from 'react';

interface UserGroup {
  groupId: string;
  name: string;
  subscriptionTier: string;
  exportDefaults: Record<string, unknown> | null;
  customFields: Record<string, unknown> | null;
}

export function UserGroupsPage() {
  // TODO: useQuery(LIST_USER_GROUPS)
  const [groups] = useState<UserGroup[]>([
    { groupId: 'free', name: 'Free Tier', subscriptionTier: 'FREE', exportDefaults: null, customFields: null },
    { groupId: 'standard', name: 'Standard', subscriptionTier: 'STANDARD', exportDefaults: null, customFields: null },
    { groupId: 'premium', name: 'Premium', subscriptionTier: 'PREMIUM', exportDefaults: null, customFields: null },
  ]);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>User Groups</h2>
      <p style={{ color: '#64748B', marginBottom: 24 }}>
        User groups are automatically mapped from subscription tiers. Configure export defaults and custom fields per group.
      </p>

      <div style={{ display: 'grid', gap: 16 }}>
        {groups.map((group) => (
          <div key={group.groupId} style={{ background: '#FFF', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600 }}>{group.name}</h3>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 8px', borderRadius: 12, background: '#EFF6FF', color: '#2563EB' }}>
                {group.subscriptionTier}
              </span>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Export defaults: {group.exportDefaults ? 'Configured' : 'Not set'}
            </p>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              Custom CPD fields: {group.customFields ? 'Configured' : 'None'}
            </p>
            <button style={{ padding: '8px 16px', background: '#2563EB', color: '#FFF', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 13 }}>
              Edit Settings
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
