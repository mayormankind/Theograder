import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return this.transporter;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const mailOptions = {
        from: process.env.SMTP_FROM || `"TheoGrader" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Email templates
  sendVerificationEmail(email: string, name: string, verificationToken: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f1f3d; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0f1f3d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TheoGrader!</h1>
            <p>Intelligent Assessment System</p>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hi ${name},</p>
            <p>Thank you for signing up for TheoGrader. To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0f1f3d;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with TheoGrader, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 TheoGrader. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - TheoGrader',
      html,
      text: `Hi ${name},\n\nPlease verify your email address by visiting: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can ignore this email.\n\nTheoGrader Team`,
    });
  }

  sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f1f3d; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
            <p>TheoGrader</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your TheoGrader account. Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 TheoGrader. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - TheoGrader',
      html,
      text: `Hi ${name},\n\nReset your password by visiting: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, you can ignore this email.\n\nTheoGrader Team`,
    });
  }

  sendOTPEmail(email: string, name: string, otp: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f1f3d; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .otp { font-size: 32px; font-weight: bold; color: #0f1f3d; text-align: center; letter-spacing: 8px; margin: 20px 0; padding: 20px; background: #f0f4f8; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>One-Time Password</h1>
            <p> TheoGrader</p>
          </div>
          <div class="content">
            <h2>Your Verification Code</h2>
            <p>Hi ${name},</p>
            <p>Use the following one-time password to complete your action:</p>
            <div class="otp">${otp}</div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this code, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 TheoGrader. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Your Verification Code - TheoGrader',
      html,
      text: `Hi ${name},\n\nYour one-time password is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, you can ignore this email.\n\nTheoGrader Team`,
    });
  }

  sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to TheoGrader</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0f1f3d; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #0f1f3d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to TheoGrader! 🎉</h1>
            <p>Your account is now active</p>
          </div>
          <div class="content">
            <h2>Get Started with Intelligent Grading</h2>
            <p>Hi ${name},</p>
            <p>Congratulations! Your TheoGrader account has been successfully created and verified. You're now ready to experience the future of automated grading.</p>
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <h3>What's Next?</h3>
            <ul>
              <li>📝 Create your first rubric using our AI-powered extraction</li>
              <li>📄 Upload examination scripts for automatic grading</li>
              <li>📊 View detailed analytics and performance insights</li>
              <li>🔄 Streamline your grading workflow</li>
            </ul>
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 TheoGrader. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to TheoGrader! 🎉',
      html,
      text: `Hi ${name},\n\nWelcome to TheoGrader! Your account is now active.\n\nVisit your dashboard to get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nTheoGrader Team`,
    });
  }

  async sendGradingCompleteEmail(
    to: string,
    lecturerName: string,
    summary: {
      examTitle: string,
      examId: string,
      total: number,
      successful: number,
      failed: number,
      flagged: { 
        studentId: string, 
        studentName: string, 
        reason: string 
      }[]
    }
  ): Promise<boolean> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resultsUrl = `${appUrl}/dashboard/results?examId=${summary.examId}`;

    const flaggedRows = summary.flagged.length > 0
      ? summary.flagged.map(f => `
          <tr>
            <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;">
              ${f.studentId || 'Unknown'}
            </td>
            <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;">
              ${f.studentName || 'Unknown'}
            </td>
            <td style="padding:6px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#d97706;">
              ${f.reason}
            </td>
          </tr>`).join('')
      : `<tr><td colspan="3" style="padding:12px;text-align:center;color:#94a3b8;font-size:13px;">
          No scripts flagged for review
         </td></tr>`;

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
        <div style="background:#0f1f3d;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h1 style="color:white;margin:0;font-size:20px;">TheoGrader</h1>
          <p style="color:#94a3b8;margin:4px 0 0;font-size:13px;">Grading Complete</p>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <p style="color:#334155;font-size:15px;">Hi ${lecturerName},</p>
          <p style="color:#334155;font-size:14px;">
            Batch grading for <strong>${summary.examTitle}</strong> has completed.
          </p>

          <div style="display:flex;gap:12px;margin:20px 0;">
            <div style="flex:1;background:white;border:1px solid #e2e8f0;border-radius:8px;padding:16px;text-align:center;">
              <p style="font-size:24px;font-weight:700;color:#0f1f3d;margin:0;">${summary.total}</p>
              <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Total</p>
            </div>
            <div style="flex:1;background:white;border:1px solid #99f6e4;border-radius:8px;padding:16px;text-align:center;">
              <p style="font-size:24px;font-weight:700;color:#0d9488;margin:0;">${summary.successful}</p>
              <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Graded</p>
            </div>
            <div style="flex:1;background:white;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;">
              <p style="font-size:24px;font-weight:700;color:#d97706;margin:0;">${summary.flagged.length}</p>
              <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Needs Review</p>
            </div>
            <div style="flex:1;background:white;border:1px solid #fecaca;border-radius:8px;padding:16px;text-align:center;">
              <p style="font-size:24px;font-weight:700;color:#ef4444;margin:0;">${summary.failed}</p>
              <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Failed</p>
            </div>
          </div>

          ${summary.flagged.length > 0 ? `
          <p style="color:#334155;font-size:14px;font-weight:600;margin:20px 0 8px;">
            Scripts Needing Attention:
          </p>
          <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Matric No</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Name</th>
                <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Reason</th>
              </tr>
            </thead>
            <tbody>${flaggedRows}</tbody>
          </table>` : ''}

          <div style="margin-top:24px;text-align:center;">
            <a href="${resultsUrl}" style="background:#0f1f3d;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;display:inline-block;">
              View Full Results →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;margin-top:24px;text-align:center;">
            TheoGrader — Intelligent Examination System
          </p>
        </div>
      </div>`;

    return this.sendEmail({
      to,
      subject: `Grading Complete: ${summary.examTitle} (${summary.total} scripts)`,
      html,
    });
  }
}

export const emailService = new EmailService();
