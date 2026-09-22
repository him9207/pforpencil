import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Resend client
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

// -----------------------------------------------------------------------------
// API ROUTES
// -----------------------------------------------------------------------------

// 1. Health check & email provider status
app.get('/api/email-status', (req, res) => {
  const hasResend = Boolean(process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY);
  res.json({
    status: 'ok',
    liveEmailEnabled: hasResend,
    provider: hasResend ? 'Resend' : 'Simulated Delivery'
  });
});

// 2. Dispatch 6-digit OTP Verification Email
app.post('/api/send-otp-email', async (req, res) => {
  try {
    const { to, otpCode, purpose, recipientName } = req.body;

    if (!to || !otpCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: to and otpCode are required.'
      });
    }

    const cleanEmail = String(to).trim().toLowerCase();
    const actionLabel = purpose === 'register' 
      ? 'Account Registration' 
      : purpose === 'login' 
      ? 'Sign-In Authentication' 
      : 'Password Reset & Recovery';

    const resend = getResendClient();

    // If Resend API key is available, dispatch live email to user's real inbox
    if (resend) {
      try {
        const fromEmail = process.env.EMAIL_FROM || 'P for Pencil <onboarding@resend.dev>';
        
        const htmlTemplate = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8faff; margin: 0; padding: 20px; color: #1e293b; }
              .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e1e6f1; overflow: hidden; box-shadow: 0 4px 20px rgba(16, 36, 111, 0.06); }
              .header { background: #10246f; padding: 28px 24px; text-align: center; color: #ffffff; }
              .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
              .content { padding: 32px 28px; }
              .otp-box { background: #f0f4ff; border: 2px dashed #3b82f6; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
              .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #10246f; font-family: monospace; }
              .footer { background: #f8faff; padding: 18px 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e1e6f1; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>P for Pencil</h1>
                <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Universal Early Learning Ecosystem</p>
              </div>
              <div class="content">
                <h2 style="font-size: 18px; color: #10246f; margin-top: 0;">Verification Code (OTP)</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                  Hello${recipientName ? ' ' + recipientName : ''},
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                  You requested a 6-digit one-time passcode for <strong>${actionLabel}</strong> on P for Pencil.
                </p>
                <div class="otp-box">
                  <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #3b82f6; margin-bottom: 6px;">Your One-Time Code</div>
                  <div class="otp-code">${otpCode}</div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for 10 minutes. Do not share this code.</div>
                </div>
                <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
                  If you did not request this code, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                &copy; ${new Date().getFullYear()} P for Pencil. All rights reserved.
              </div>
            </div>
          </body>
          </html>
        `;

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [cleanEmail],
          subject: `${otpCode} is your P for Pencil ${actionLabel} Verification Code`,
          html: htmlTemplate,
        });

        if (error) {
          console.warn('Resend email error:', error);
          return res.json({
            success: true,
            simulated: true,
            dispatchedToInbox: false,
            code: otpCode,
            message: `Could not send via Resend (${error.message}). Using instant simulation mode.`
          });
        }

        return res.json({
          success: true,
          simulated: false,
          dispatchedToInbox: true,
          emailId: data?.id,
          code: otpCode,
          message: `Live verification email successfully sent to ${cleanEmail}!`
        });
      } catch (sendErr: any) {
        console.warn('Resend execution error:', sendErr);
        return res.json({
          success: true,
          simulated: true,
          dispatchedToInbox: false,
          code: otpCode,
          message: 'Error in live dispatch. Switched to simulation mode.'
        });
      }
    }

    // Default: Return simulated delivery confirmation (ready for live API key anytime)
    return res.json({
      success: true,
      simulated: true,
      dispatchedToInbox: false,
      code: otpCode,
      message: `Simulated OTP code ${otpCode} generated for ${cleanEmail}. Add RESEND_API_KEY in Settings to enable real inbox delivery.`
    });
  } catch (err: any) {
    console.error('Server OTP error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal Server Error'
    });
  }
});

// -----------------------------------------------------------------------------
// VITE / STATIC SERVING
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`P for Pencil server running on port ${PORT}`);
  });
}

startServer();
