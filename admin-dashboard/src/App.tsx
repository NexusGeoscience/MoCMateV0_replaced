import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { CategoriesPage } from './pages/CategoriesPage';
import { LessonsPage } from './pages/LessonsPage';
import { LessonEditorPage } from './pages/LessonEditorPage';
import { UserGroupsPage } from './pages/UserGroupsPage';
import { ExportDefaultsPage } from './pages/ExportDefaultsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/categories" replace />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="lessons" element={<LessonsPage />} />
        <Route path="lessons/new" element={<LessonEditorPage />} />
        <Route path="lessons/:lessonId" element={<LessonEditorPage />} />
        <Route path="user-groups" element={<UserGroupsPage />} />
        <Route path="export-defaults" element={<ExportDefaultsPage />} />
      </Route>
    </Routes>
  );
}
