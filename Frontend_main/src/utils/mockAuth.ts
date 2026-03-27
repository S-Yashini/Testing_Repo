/**
 * Mock Authentication Functions (UI-Only)
 * 
 * Simulates Ping ID / MS login with hardcoded tokens.
 * This will be replaced with real API calls when backend is ready.
 */

import { authStorage } from './authStorage';

// Hardcoded mock tokens
const MOCK_ACCESS_TOKEN = 'mock_access_token_123';
const MOCK_REFRESH_TOKEN = 'mock_refresh_token_456';

export interface User {
  name: string;
  email: string;
  roles: string[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Mock login function (simulates Ping ID / MS login)
 * Returns hardcoded user data and tokens
 */
export const mockLogin = (): AuthResponse => {
  // Store tokens
  authStorage.setTokens(MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN);

  // Return user data
  return {
    user: {
      name: 'Karnati, Kiran Kumar',
      email: 'kkarnati@estee.com',
      roles: ['GHS_APPROVER', 'DG_APPROVER'],
    },
    accessToken: MOCK_ACCESS_TOKEN,
    refreshToken: MOCK_REFRESH_TOKEN,
  };
};

/**
 * Restore session on page refresh
 * Checks for refresh token and simulates token refresh
 */
export const restoreSession = (): User | null => {
  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  // Simulate token refresh - restore access token
  authStorage.setTokens(MOCK_ACCESS_TOKEN, refreshToken);

  // Return user data
  return {
    name: 'Karnati, Kiran Kumar',
    email: 'kkarnati@estee.com',
    roles: ['GHS_APPROVER', 'DG_APPROVER'],
  };
};

/**
 * Mock logout function
 */
export const mockLogout = (): void => {
  authStorage.clear();
};

