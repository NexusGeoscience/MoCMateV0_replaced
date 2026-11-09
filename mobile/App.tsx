import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { apolloClient } from './src/services/apollo';
import { AuthProvider } from './src/services/auth';
import { SubscriptionProvider } from './src/services/subscription';

export default function App() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="auto" />
            </NavigationContainer>
          </SubscriptionProvider>
        </AuthProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}
