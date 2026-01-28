import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Email template types
export type EmailTemplateType =
  | 'application_received'
  | 'application_reminder'
  | 'application_admitted'
  | 'application_conditional'
  | 'application_rejected'
  | 'resume_link';

interface EmailTemplate {
  subject: string;
  html: string;
}

interface TemplateData {
  firstName: string;
  email?: string;
  resumeLink?: string;
  dashboardLink?: string;
  preWorkTask?: string;
  rejectionReason?: string;
  skillTrack?: string;
  cohortName?: string;
}

@Injectable()
export class EmailService {
  private resendApiKey: string;
  private fromEmail = 'Project 3:10 <noreply@cycle28.org>';

  constructor(private configService: ConfigService) {
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY') || '';
  }

  // ===== EMAIL TEMPLATES =====
  // These can later be moved to database for CMS editing

  private templates: Record<EmailTemplateType, (data: TemplateData) => EmailTemplate> = {

    application_received: (data) => ({
      subject: `We've received your application, ${data.firstName}! 🎉`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #02213D;">Application Received!</h1>
          
          <p>Hi ${data.firstName},</p>
          
          <p>Thank you for applying to <strong>Project 3:10</strong>. We've received your application and our team is reviewing it.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">What happens next?</h3>
            <ol style="margin-bottom: 0;">
              <li><strong>Review (48 hours)</strong> — Our team reviews your application</li>
              <li><strong>Decision</strong> — You'll receive an email with our decision</li>
              <li><strong>Onboarding</strong> — If admitted, your journey begins!</li>
            </ol>
          </div>
          
          <p>While you wait, save our WhatsApp number: <strong>+234 XXX XXX XXXX</strong></p>
          
          <p style="color: #666;">— The Project 3:10 Team</p>
        </div>
      `
    }),

    application_reminder: (data) => ({
      subject: `Don't forget to complete your application, ${data.firstName}!`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #02213D;">Your application is waiting ⏳</h1>
          
          <p>Hi ${data.firstName},</p>
          
          <p>You started your Project 3:10 application but haven't finished it yet. Don't let this opportunity slip away!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resumeLink}" style="background: #C4A052; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Continue My Application →
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
          
          <p style="color: #666;">— The Project 3:10 Team</p>
        </div>
      `
    }),

    application_admitted: (data) => ({
      subject: `🎉 Congratulations ${data.firstName}! You're in!`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #02213D;">Welcome to Project 3:10! 🚀</h1>
          
          <p>Hi ${data.firstName},</p>
          
          <p><strong>Congratulations!</strong> You've been admitted to Project 3:10${data.cohortName ? ` — ${data.cohortName}` : ''}.</p>
          
          ${data.skillTrack ? `<p>Your track: <strong>${data.skillTrack}</strong></p>` : ''}
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your next steps:</h3>
            <ol style="margin-bottom: 0;">
              <li>Access your dashboard</li>
              <li>Complete your profile</li>
              <li>Start your first mission</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardLink}" style="background: #C4A052; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Access My Dashboard →
            </a>
          </div>
          
          <p>Remember: <strong>From potential to paycheck.</strong> Your journey starts now.</p>
          
          <p style="color: #666;">— The Project 3:10 Team</p>
        </div>
      `
    }),

    application_conditional: (data) => ({
      subject: `Almost there, ${data.firstName}! One more step...`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #02213D;">You're almost in! 🎯</h1>
          
          <p>Hi ${data.firstName},</p>
          
          <p>We've reviewed your application and we see potential in you. However, before we can fully admit you, we need you to complete one pre-work task.</p>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C4A052;">
            <h3 style="margin-top: 0;">Your Pre-Work Task:</h3>
            <p style="margin-bottom: 0;">${data.preWorkTask || 'Complete the introductory quiz'}</p>
          </div>
          
          <p><strong>Deadline:</strong> 7 days from now</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardLink}" style="background: #C4A052; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Complete My Task →
            </a>
          </div>
          
          <p style="color: #666;">— The Project 3:10 Team</p>
        </div>
      `
    }),

    application_rejected: (data) => ({
      subject: `Update on your Project 3:10 application`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #02213D;">Thank you for applying</h1>
          
          <p>Hi ${data.firstName},</p>
          
          <p>After careful review, we're unable to offer you a spot in Project 3:10 at this time.</p>
          
          ${data.rejectionReason ? `
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Reason:</strong> ${data.rejectionReason}</p>
          </div>
          ` : ''}
          
          <p>This doesn't mean you can't succeed. Here are some free resources to help you get started:</p>
          
          <ul>
            <li><a href="https://www.youtube.com/@Cycle28Official">Our YouTube Channel</a> — Free tutorials</li>
            <li><a href="https://cycle28.org/resources">Resource Library</a> — Guides and tools</li>
          </ul>
          
          <p>You're welcome to reapply in the future after building more experience.</p>
          
          <p style="color: #666;">— The Project 3:10 Team</p>
        </div>
      `
    }),

    resume_link: (data) => ({
      subject: `Continue your application, ${data.firstName}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #02213D;">Here's your resume link 🔗</h1>
          
          <p>Hi ${data.firstName},</p>
          
          <p>You requested a link to continue your Project 3:10 application. Click below to pick up where you left off:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resumeLink}" style="background: #C4A052; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Continue My Application →
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">This link expires in 7 days. If you didn't request this, you can ignore this email.</p>
          
          <p style="color: #666;">— The Project 3:10 Team</p>
        </div>
      `
    }),
  };

  // ===== SEND EMAIL =====
  async sendEmail(to: string, templateType: EmailTemplateType, data: TemplateData): Promise<boolean> {
    const template = this.templates[templateType](data);

    // If no API key, log to console (dev mode)
    if (!this.resendApiKey) {
      console.log('📧 [DEV] Email would be sent:');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${template.subject}`);
      console.log(`   Template: ${templateType}`);
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject: template.subject,
          html: template.html,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send email:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }

  // ===== CONVENIENCE METHODS =====
  async sendApplicationReceived(email: string, firstName: string) {
    return this.sendEmail(email, 'application_received', { firstName });
  }

  async sendApplicationReminder(email: string, firstName: string, resumeLink: string) {
    return this.sendEmail(email, 'application_reminder', { firstName, resumeLink });
  }

  async sendAdmissionEmail(email: string, firstName: string, dashboardLink: string, skillTrack?: string, cohortName?: string) {
    return this.sendEmail(email, 'application_admitted', { firstName, dashboardLink, skillTrack, cohortName });
  }

  async sendConditionalEmail(email: string, firstName: string, dashboardLink: string, preWorkTask: string) {
    return this.sendEmail(email, 'application_conditional', { firstName, dashboardLink, preWorkTask });
  }

  async sendRejectionEmail(email: string, firstName: string, rejectionReason?: string) {
    return this.sendEmail(email, 'application_rejected', { firstName, rejectionReason });
  }

  async sendResumeLink(email: string, firstName: string, resumeLink: string) {
    return this.sendEmail(email, 'resume_link', { firstName, resumeLink });
  }
}
