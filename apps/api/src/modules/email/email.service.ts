import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Email Service — powered by Resend
 *
 * Dev  (NODE_ENV !== 'production'): logs to console, no emails sent
 * Prod (NODE_ENV === 'production'): sends via Resend API
 *
 * Set RESEND_API_KEY in environment to enable.
 * Free tier: 3,000 emails/month, 100/day — plenty for a B2B platform.
 *
 * Get your key at: https://resend.com  (free, no credit card)
 */

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';
  private resend: Resend | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('✅ Resend email provider initialized');
    } else if (!this.isDevelopment) {
      this.logger.warn(
        '⚠️  RESEND_API_KEY not set — emails will be logged only. Get a free key at https://resend.com',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ─────────────────────────────────────────────────────────────────────────

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/auth/verify-email?token=${token}`;

    await this.send({
      to: email,
      subject: 'Verify your email — DistroPro',
      html: this.buildTemplate({
        preheader: 'Please verify your email to activate your account.',
        heading: 'Verify Your Email',
        body: `<p>Thanks for signing up! Click the button below to verify your email address and activate your account.</p>
               <p>This link expires in <strong>24 hours</strong>.</p>`,
        ctaText: 'Verify Email',
        ctaUrl: link,
        footer: "If you didn't create an account, you can safely ignore this email.",
      }),
    });
  }

  async sendApprovalEmail(email: string, userName: string, reason?: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    await this.send({
      to: email,
      subject: '✅ Your account has been approved — DistroPro',
      html: this.buildTemplate({
        preheader: 'Great news! Your DistroPro account is now active.',
        heading: 'Account Approved!',
        body: `<p>Hi <strong>${userName}</strong>,</p>
               <p>Your DistroPro account has been reviewed and approved. You can now log in and start using the platform.</p>
               ${reason ? `<p><strong>Note from admin:</strong> ${reason}</p>` : ''}`,
        ctaText: 'Log In Now',
        ctaUrl: `${frontendUrl}/login`,
        footer: 'If you have any questions, contact your platform administrator.',
      }),
    });
  }

  async sendRejectionEmail(email: string, userName: string, reason: string): Promise<void> {
    await this.send({
      to: email,
      subject: 'Account application update — DistroPro',
      html: this.buildTemplate({
        preheader: 'An update on your DistroPro account application.',
        heading: 'Application Update',
        body: `<p>Hi <strong>${userName}</strong>,</p>
               <p>Unfortunately, we were unable to approve your account at this time.</p>
               <p><strong>Reason:</strong> ${reason}</p>
               <p>If you believe this is a mistake or need further assistance, please contact the platform administrator.</p>`,
        footer: 'If you have any questions, contact your platform administrator.',
      }),
    });
  }

  async sendStaffInvitation(email: string, invitationCode: string, inviterName: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const link = `${frontendUrl}/signup/staff?code=${invitationCode}&email=${encodeURIComponent(email)}`;

    await this.send({
      to: email,
      subject: `${inviterName} invited you to DistroPro`,
      html: this.buildTemplate({
        preheader: `You've been invited to join DistroPro as a staff member.`,
        heading: "You're Invited!",
        body: `<p><strong>${inviterName}</strong> has invited you to join DistroPro as a staff member.</p>
               <p>Click the button below to accept the invitation and create your account.</p>
               <p>Or use this invitation code manually: <code style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-family:monospace;">${invitationCode}</code></p>
               <p>This invitation expires in <strong>7 days</strong>.</p>`,
        ctaText: 'Accept Invitation',
        ctaUrl: link,
        footer: "If you weren't expecting this invitation, you can safely ignore it.",
      }),
    });
  }

  async sendOrderConfirmation(
    email: string,
    userName: string,
    orderId: string,
    orderTotal: number,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    await this.send({
      to: email,
      subject: `Order confirmed #${orderId} — DistroPro`,
      html: this.buildTemplate({
        preheader: `Your order #${orderId} has been received.`,
        heading: '📦 Order Confirmed',
        body: `<p>Hi <strong>${userName}</strong>,</p>
               <p>Thank you for your order! Here's a summary:</p>
               <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                 <tr style="background:#f9fafb;">
                   <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;">Order ID</td>
                   <td style="padding:10px 12px;border:1px solid #e5e7eb;">#${orderId}</td>
                 </tr>
                 <tr>
                   <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;">Total</td>
                   <td style="padding:10px 12px;border:1px solid #e5e7eb;">₹${(orderTotal / 100).toFixed(2)}</td>
                 </tr>
                 <tr style="background:#f9fafb;">
                   <td style="padding:10px 12px;border:1px solid #e5e7eb;font-weight:600;">Status</td>
                   <td style="padding:10px 12px;border:1px solid #e5e7eb;">Pending Approval</td>
                 </tr>
               </table>
               <p>You'll receive an update once your order is processed.</p>`,
        ctaText: 'Track Order',
        ctaUrl: `${frontendUrl}/orders/${orderId}`,
        footer: 'If you have any questions about your order, contact your account manager.',
      }),
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────

  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const from = this.configService.get<string>('EMAIL_FROM', 'DistroPro <onboarding@resend.dev>');

    if (this.isDevelopment || !this.resend) {
      // Development: log to console
      this.logger.log(`📧 [EMAIL DEV] To: ${options.to} | Subject: "${options.subject}"`);
      this.logger.debug(`📧 [EMAIL DEV] Would send via Resend in production`);
      return;
    }

    try {
      const result = await this.resend.emails.send({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (result.error) {
        this.logger.error(`❌ Resend error: ${JSON.stringify(result.error)}`);
        throw new Error(result.error.message);
      }

      this.logger.log(`✅ Email sent to ${options.to} (id: ${result.data?.id})`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${options.to}:`, error);
      // Don't throw — email failure should not break the main flow
    }
  }

  /** Shared branded HTML email template */
  private buildTemplate(opts: {
    preheader: string;
    heading: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
    footer?: string;
  }): string {
    const cta = opts.ctaText && opts.ctaUrl
      ? `<div style="text-align:center;margin:32px 0;">
           <a href="${opts.ctaUrl}"
              style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;
                     padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;
                     letter-spacing:0.3px;">
             ${opts.ctaText}
           </a>
         </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${opts.heading}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f3f4f6;">
    ${opts.preheader}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:12px;overflow:hidden;
                      box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;padding:28px 40px;text-align:center;">
              <span style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                📦 DistroPro
              </span>
              <br/>
              <span style="color:#c7d2fe;font-size:12px;">B2B Distribution Platform</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827;">
                ${opts.heading}
              </h1>
              <div style="font-size:15px;line-height:1.6;color:#374151;">
                ${opts.body}
              </div>
              ${cta}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 32px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;"/>
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                ${opts.footer ?? 'This email was sent by DistroPro. Please do not reply to this email.'}
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#d1d5db;">
                © ${new Date().getFullYear()} DistroPro · B2B Distribution Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
