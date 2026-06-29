import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/categories', label: 'Categories' },
  { to: '/lessons', label: 'Lessons' },
  { to: '/user-groups', label: 'User Groups' },
  { to: '/export-defaults', label: 'Export Defaults' },
];

export function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{ width: 240, background: '#1E293B', padding: '24px 16px', color: '#FFF' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 32 }}>MoC-mate Admin</h1>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {navItems.map(({ to, label }) => (
            <li key={to} style={{ marginBottom: 8 }}>
              <NavLink
                to={to}
                style={({ isActive }) => ({
                  display: 'block',
                  padding: '10px 12px',
                  borderRadius: 8,
                  color: isActive ? '#FFF' : '#94A3B8',
                  background: isActive ? '#334155' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, background: '#F8FAFC', padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}
