import { apiClient } from '../api/apiClient';

export const OtpService = {
  sendOTP: async (email: string): Promise<string> => {
    const response = await apiClient.post<{ otp?: string }>('/api/auth/admin/send-otp', { email });
    return response.data.otp || '';
  },

  verifyOTP: async (email: string, enteredCode: string): Promise<boolean> => {
    const response = await apiClient.post<{ success: boolean }>('/api/auth/admin/verify-otp', {
      email,
      otp: enteredCode,
    });
    return response.data.success;
  }
};
export default OtpService;
