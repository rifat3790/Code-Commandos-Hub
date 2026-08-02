import nodemailer from 'nodemailer';

export async function sendResetCodeEmail(toEmail: string, code: string) {
  try {
    // Configure Nodemailer Transport
    // Uses environment variables or fallback SMTP config
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || 'mdrifayethossen@gmail.com';
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpPass ? {
        user: smtpUser,
        pass: smtpPass
      } : undefined
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Code Commandos Security Verification Code</title>
      </head>
      <body style="background-color: #030712; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; margin: 0;">
        <div style="max-width: 540px; margin: 0 auto; background: #070c18; border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 20px; padding: 32px; box-shadow: 0 0 50px rgba(34, 197, 94, 0.15);">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; padding: 6px 14px; border-radius: 30px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">
              • CODE COMMANDOS SECURITY CLEARANCE
            </div>
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; margin-top: 16px; margin-bottom: 4px; text-transform: uppercase;">
              Password Verification Code
            </h1>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              Verification code requested for <strong style="color: #4ade80;">${toEmail}</strong>
            </p>
          </div>

          <!-- Code Box -->
          <div style="background: #000000; border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; box-shadow: 0 0 25px rgba(34, 197, 94, 0.2);">
            <div style="font-size: 11px; color: #9ca3af; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;">
              YOUR 6-DIGIT VERIFICATION CODE
            </div>
            <div style="font-size: 36px; font-weight: 900; color: #22c55e; letter-spacing: 12px; font-family: monospace;">
              ${code}
            </div>
            <div style="font-size: 11px; color: #6b7280; margin-top: 12px;">
              ⏱️ Valid for 15 minutes • Do not share this code with anyone
            </div>
          </div>

          <!-- Info Box -->
          <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 16px; font-size: 12px; color: #d1d5db; line-height: 1.6;">
            <strong style="color: #ffffff;">Need Immediate Assistance?</strong><br>
            If you do not receive this email or cannot access your inbox, you can contact your <strong>System Administrator</strong> directly. They can provide your active 6-digit code directly from the <strong>Admin Panel</strong>.
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; color: #6b7280;">
            Code Commandos Security Hub &copy; ${new Date().getFullYear()} • Encrypted Operations
          </div>

        </div>
      </body>
      </html>
    `;

    if (!smtpPass && process.env.NODE_ENV === 'development') {
      console.log(`[DEVELOPMENT MAIL LOG] Code for ${toEmail}: ${code}`);
      return { success: true, mode: 'log' };
    }

    const info = await transporter.sendMail({
      from: `"Code Commandos Security" <${smtpUser}>`,
      to: toEmail,
      subject: `[${code}] Your 6-Digit Password Reset Verification Code`,
      html: htmlContent
    });

    console.log(`Email successfully sent to ${toEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending reset email via Nodemailer:', error);
    return { success: false, error };
  }
}
