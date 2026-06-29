import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../services/auth';
import { CpdStackParamList, LearnStackParamList, ProfileStackParamList } from '../types';

// CPD screens
import { CpdHomeScreen } from '../screens/cpd/CpdHomeScreen';
import { ActivityDetailScreen } from '../screens/cpd/ActivityDetailScreen';
import { ActivityFormScreen } from '../screens/cpd/ActivityFormScreen';
import { DraftsScreen } from '../screens/cpd/DraftsScreen';
import { ExportOptionsScreen } from '../screens/cpd/ExportOptionsScreen';

// Learn screens
import { LearnHomeScreen } from '../screens/learn/LearnHomeScreen';
import { LessonDetailScreen } from '../screens/learn/LessonDetailScreen';
import { LessonContentScreen } from '../screens/learn/LessonContentScreen';

// Profile screens
import { ProfileHomeScreen } from '../screens/profile/ProfileHomeScreen';
import { ExportPresetsScreen } from '../screens/profile/ExportPresetsScreen';

// Auth screen
import { LoginScreen } from '../screens/LoginScreen';

// ── Stack navigators ─────────────────────────────────────────────────────────
const CpdStack = createNativeStackNavigator<CpdStackParamList>();
const LearnStack = createNativeStackNavigator<LearnStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator();

function CpdNavigator() {
  return (
    <CpdStack.Navigator screenOptions={{ headerBackTitleVisible: false }}>
      <CpdStack.Screen name="CpdHome" component={CpdHomeScreen} options={{ title: 'CPD Tracker' }} />
      <CpdStack.Screen name="ActivityDetail" component={ActivityDetailScreen} options={{ title: 'Activity' }} />
      <CpdStack.Screen name="ActivityForm" component={ActivityFormScreen} options={{ title: 'Log Activity' }} />
      <CpdStack.Screen name="Drafts" component={DraftsScreen} options={{ title: 'Drafts' }} />
      <CpdStack.Screen name="ExportOptions" component={ExportOptionsScreen} options={{ title: 'Export Report' }} />
    </CpdStack.Navigator>
  );
}

function LearnNavigator() {
  return (
    <LearnStack.Navigator screenOptions={{ headerBackTitleVisible: false }}>
      <LearnStack.Screen name="LearnHome" component={LearnHomeScreen} options={{ title: 'Learn' }} />
      <LearnStack.Screen name="LessonDetail" component={LessonDetailScreen} options={{ title: 'Lesson' }} />
      <LearnStack.Screen name="LessonContent" component={LessonContentScreen} options={{ headerShown: false }} />
    </LearnStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerBackTitleVisible: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileHomeScreen} options={{ title: 'Profile' }} />
      <ProfileStack.Screen name="ExportPresets" component={ExportPresetsScreen} options={{ title: 'Export Presets' }} />
      <ProfileStack.Screen name="ExportOptions" component={ExportOptionsScreen} options={{ title: 'Export Report' }} />
    </ProfileStack.Navigator>
  );
}

// ── Root navigator ───────────────────────────────────────────────────────────
export function RootNavigator() {
  const { isAuthenticated, isLoading, isPremium } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="CPD"
        component={CpdNavigator}
        options={{ tabBarLabel: 'CPD' }}
      />
      {isPremium && (
        <Tab.Screen
          name="Learn"
          component={LearnNavigator}
          options={{ tabBarLabel: 'Learn' }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
