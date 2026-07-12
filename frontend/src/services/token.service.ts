// BACKEND API
// JWT tokens are signed server-side upon successful authentication/verification.
// For the frontend, TokenService abstracts saving and reading this token.
export const TokenService = {
  getToken: (): string | null => {
    return localStorage.getItem('aureon_jwt_token');
  },

  setToken: (token: string): void => {
    localStorage.setItem('aureon_jwt_token', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('aureon_jwt_token');
  },

  // Simulating token payload parsing
  getUserPayload: (): any | null => {
    const token = localStorage.getItem('aureon_jwt_token');
    if (!token) return null;
    try {
      // Decode simulated payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  },

  // Simulate generation of a mock JWT token on signup/login
  generateMockJWT: (payload: object): string => {
    const header = window.btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const data = window.btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }));
    const signature = 'mock_signature_hash_xyz';
    const mockToken = `${header}.${data}.${signature}`;
    localStorage.setItem('aureon_jwt_token', mockToken);
    return mockToken;
  }
};
