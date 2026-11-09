import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { User, SubscriptionTier } from '../types';

// ── Types ────────────────────────────────────────────────────────────────────
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

// ── Storage keys ─────────────────────────────────────────────────────────────
const TOKEN_KEY = '@moc_mate_token';
const USER_KEY = '@moc_mate_user';

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null);

// ── Token access (used by Apollo link) ───────────────────────────────────────
let _accessToken: string | null = null;

export async function getAccessToken(): Promise<string | null> {
  if (_accessToken) return _accessToken;
  return AsyncStorage.getItem(TOKEN_KEY);
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
  });

  // Check for stored session on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        const userJson = await AsyncStorage.getItem(USER_KEY);
        if (token && userJson) {
          const user = JSON.parse(userJson) as User;
          _accessToken = token;
          setState({ isAuthenticated: true, isLoading: false, user, accessToken: token });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async () => {
    // Auth0 PKCE flow via expo-auth-session
    const discovery = {
      authorizationEndpoint: `https://${ENV.AUTH0_DOMAIN}/authorize`,
      tokenEndpoint: `https://${ENV.AUTH0_DOMAIN}/oauth/token`,
      revocationEndpoint: `https://${ENV.AUTH0_DOMAIN}/oauth/revoke`,
    };

    const redirectUri = AuthSession.makeRedirectUri({ scheme: 'mocmate' });

    const request = new AuthSession.AuthRequest({
      clientId: ENV.AUTH0_CLIENT_ID,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      redirectUri,
      extraParams: { audience: ENV.AUTH0_AUDIENCE },
      usePKCE: true,
    });

    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.params.code) {
      // Exchange code for tokens
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: ENV.AUTH0_CLIENT_ID,
          code: result.params.code,
          redirectUri,
          extraParams: { code_verifier: request.codeVerifier! },
        },
        discovery,
      );

      const token = tokenResult.accessToken;
      _accessToken = token;

      // Decode JWT for basic user info (in production, call /userinfo or your API)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user: User = {
        userId: payload.sub,
        email: payload.email || '',
        displayName: payload.name || payload.nickname || '',
        subscriptionTier: (payload['https://mocmate.com/tier'] as SubscriptionTier) || SubscriptionTier.FREE,
        groupId: payload['https://mocmate.com/group'] || 'free',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      setState({ isAuthenticated: true, isLoading: false, user, accessToken: token });
    }
  }, []);

  const logout = useCallback(async () => {
    _accessToken = null;
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setState({ isAuthenticated: false, isLoading: false, user: null, accessToken: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
