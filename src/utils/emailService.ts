export interface SendOtpEmailOptions {
  to: string;
  otpCode: string;
  purpose: 'register' | 'login' | 'forgot_password';
  recipientName?: string;
}

export interface SendOtpEmailResult {
  success: boolean;
  simulated: boolean;
  dispatchedToInbox?: boolean;
  code: string;
  message: string;
  emailId?: string;
}

/**
 * Dispatches an OTP verification email.
 * If live email API key (e.g. Resend) is configured on the backend, it delivers
 * the email to the recipient's real mailbox. Otherwise, it delivers in simulated mode.
 */
export async function dispatchOtpEmail(options: SendOtpEmailOptions): Promise<SendOtpEmailResult> {
  try {
    const response = await fetch('/api/send-otp-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data: SendOtpEmailResult = await response.json();
    return data;
  } catch (err) {
    console.warn('Email dispatch API fallback:', err);
    // Graceful fallback to client-side simulated delivery
    return {
      success: true,
      simulated: true,
      dispatchedToInbox: false,
      code: options.otpCode,
      message: `Simulated code ${options.otpCode} generated for ${options.to}.`
    };
  }
}

/**
 * Check if the live email delivery service is configured.
 */
export async function checkEmailServiceStatus(): Promise<{ liveEmailEnabled: boolean; provider: string }> {
  try {
    const res = await fetch('/api/email-status');
    if (!res.ok) return { liveEmailEnabled: false, provider: 'Simulated Delivery' };
    const data = await res.json();
    return {
      liveEmailEnabled: Boolean(data.liveEmailEnabled),
      provider: data.provider || 'Simulated Delivery',
    };
  } catch {
    return { liveEmailEnabled: false, provider: 'Simulated Delivery' };
  }
}
