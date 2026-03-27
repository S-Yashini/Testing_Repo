/**
 * Auth Storage Utility (UI Layer)
 * 
 * Manages token storage in sessionStorage (access token) and localStorage (refresh token).
 * This is a UI-only implementation that will be replaced when backend is ready.
 */

export const authStorage = {
  /**
   * Store access and refresh tokens
   */
  setTokens: (accessToken: string, refreshToken: string) => {
    sessionStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },

  /**
   * Get access token from sessionStorage
   */
  getAccessToken: (): string | null => {
    return sessionStorage.getItem('accessToken');
  },

  /**
   * Get refresh token from localStorage
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  /**
   * Check if user is authenticated (has access token)
   */
  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem('accessToken');
  },

  /**
   * Clear all tokens
   */
  clear: () => {
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

