import { Employee } from '../types';
import { TokenService } from './token.service';

export const SessionService = {
  // Save logged in user details and a simulated JWT token
  startSession: (user: Employee): void => {
    if (user) {
      localStorage.setItem('aureon_currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('aureon_currentUser');
    }
    // Generate simulated JWT if not already holding real JWT
    if (!TokenService.getToken()) {
      TokenService.generateMockJWT({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      });
    }
    // Trigger global synchronization
    window.dispatchEvent(new Event('storage'));
  },

  // Terminate active session and delete JWT token
  endSession: (): void => {
    localStorage.removeItem('aureon_currentUser');
    TokenService.removeToken();
    window.dispatchEvent(new Event('storage'));
  },

  // Read current active employee session details
  getActiveSession: (): Employee | null => {
    const userJson = localStorage.getItem('aureon_currentUser');
    if (userJson) {
      try {
        return JSON.parse(userJson) as Employee;
      } catch {
        return null;
      }
    }
    return null;
  },

  // Confirm if current session holds administrative credentials
  isAdminSession: (): boolean => {
    const user = SessionService.getActiveSession();
    return user ? user.role === 'Admin' : false;
  },

  // Check if session token exists and is valid
  isAuthenticated: (): boolean => {
    return TokenService.getToken() !== null && SessionService.getActiveSession() !== null;
  }
};
export default SessionService;
