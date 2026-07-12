import { Employee } from '../types';
import { TokenService } from './token.service';
import { MockDatabase } from './mockDb';

export const SessionService = {
  // Save logged in user details and a simulated JWT token
  startSession: (user: Employee): void => {
    MockDatabase.setCurrentUser(user);
    // Generate simulated JWT
    TokenService.generateMockJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status
    });
    // Trigger global synchronization
    window.dispatchEvent(new Event('storage'));
  },

  // Terminate active session and delete JWT token
  endSession: (): void => {
    MockDatabase.setCurrentUser(null);
    TokenService.removeToken();
    window.dispatchEvent(new Event('storage'));
  },

  // Read current active employee session details
  getActiveSession: (): Employee | null => {
    return MockDatabase.getCurrentUser();
  },

  // Confirm if current session holds administrative credentials
  isAdminSession: (): boolean => {
    const user = MockDatabase.getCurrentUser();
    return user ? user.role === 'Admin' : false;
  },

  // Check if session token exists and is valid
  isAuthenticated: (): boolean => {
    return TokenService.getToken() !== null && MockDatabase.getCurrentUser() !== null;
  }
};
export default SessionService;
