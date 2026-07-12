import toast from 'react-hot-toast';

export const OtpService = {
  // BACKEND API
  // Method: POST
  // Endpoint: /api/auth/admin/send-otp
  sendOTP: async (email: string): Promise<string> => {
    // Generate a secure 6-digit mock code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem(`aureon_otp_${email.toLowerCase()}`, code);
    
    // Output OTP clearly so the developer and system users see it immediately
    console.log(`[MOCK OTP SERVICE] Code sent to ${email}: ${code}`);
    toast.success(`Mock OTP sent to admin: ${code}`, {
      duration: 10000, // Show longer so user can copy it
      icon: '🔑'
    });
    
    return code;
  },

  // BACKEND API
  // Method: POST
  // Endpoint: /api/auth/admin/verify-otp
  // Authentication: None (Public)
  // Request DTO: { email: string, otp: string }
  // Response DTO: { success: boolean }
  // Expected Status Codes: 200 OK, 400 Bad Request
  verifyOTP: async (email: string, enteredCode: string): Promise<boolean> => {
    const actualCode = localStorage.getItem(`aureon_otp_${email.toLowerCase()}`);
    if (actualCode && actualCode === enteredCode) {
      localStorage.removeItem(`aureon_otp_${email.toLowerCase()}`);
      return true;
    }
    return false;
  }
};
export default OtpService;
