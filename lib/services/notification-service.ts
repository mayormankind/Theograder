import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/services/email-service';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
}

class NotificationService {
  /**
   * Primary interface to dispatch a notification. Checks database preferences
   * to decide whether to send an email, save an in-app database record, or both.
   */
  async notify(params: CreateNotificationParams): Promise<{ inAppSaved: boolean; emailSent: boolean }> {
    const { userId, type, title, message, link, metadata } = params;
    let inAppSaved = false;
    let emailSent = false;

    try {
      // 1. Fetch user notifications configuration
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, emailNotif: true, systemNotif: true }
      });

      if (!user) {
        console.error(`[NotificationService] User ${userId} not found.`);
        return { inAppSaved, emailSent };
      }

      // 2. If system (In-App) notifications are enabled, create database log
      if (user.systemNotif) {
        await prisma.notification.create({
          data: {
            userId,
            type,
            title,
            message,
            link,
            metadata: metadata ? JSON.stringify(metadata) : undefined
          }
        });
        inAppSaved = true;
      }

      // 3. If email notifications are enabled, dispatch relevant email templates
      if (user.emailNotif) {
        emailSent = await this.dispatchEmail(user.email, user.name, type, title, message, metadata);
      }

    } catch (error) {
      console.error('[NotificationService] Error executing dispatch:', error);
    }

    return { inAppSaved, emailSent };
  }

  /**
   * Internal router to format emails based on notification type.
   */
  private async dispatchEmail(
    email: string,
    name: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      switch (type) {
        case NotificationType.GRADING_COMPLETE:
          if (metadata?.examId) {
            return await emailService.sendGradingCompleteEmail(email, name, {
              examTitle: metadata.examTitle || 'Exam',
              examId: metadata.examId,
              total: metadata.total || 0,
              successful: metadata.successful || 0,
              failed: metadata.failed || 0,
              flagged: metadata.flagged || []
            });
          }
          break;

        // Fallback email dispatch for general/system alerts
        default:
          return await emailService.sendEmail({
            to: email,
            subject: title,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;">
                <div style="background:#0f1f3d;padding:16px 20px;border-radius:8px;color:white;margin-bottom:20px;">
                  <h2 style="margin:0;font-size:18px;">TheoGrader Notification</h2>
                </div>
                <p style="font-size:15px;color:#334155;line-height:1.5;">Hi ${name},</p>
                <p style="font-size:14px;color:#334155;line-height:1.5;font-weight:bold;">${title}</p>
                <p style="font-size:14px;color:#475569;line-height:1.5;background:white;padding:16px;border-radius:8px;border:1px solid #e2e8f0;">
                  ${message}
                </p>
                <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
                <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
                  You received this email because notification preferences are active in your settings page.
                </p>
              </div>
            `
          });
      }
    } catch (err) {
      console.error('[NotificationService] Email dispatch fail:', err);
    }
    return false;
  }
}

export const notificationService = new NotificationService();
