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

// Offer email specific data
export interface OfferEmailData {
  firstName: string;
  offerType: string; // FULL_SUPPORT, SKILLS_ONLY, ACCELERATOR, CATALYST_TRACK
  triadTechnical: number;
  triadSoft: number;
  triadCommercial: number;
  primaryFocus: string;
  receivesStipend: boolean;
  weeklyHours?: string;
  kpiTargets?: Record<string, number>;
  acceptLink: string;
  declineLink: string;
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

  /**
   * Send personalized offer email with Skill Triad visualization
   */
  async sendOfferEmail(email: string, data: OfferEmailData): Promise<boolean> {
    const offerLabels: Record<string, string> = {
      'FULL_SUPPORT': 'Full Support Track',
      'SKILLS_ONLY': 'Skills Development Track',
      'ACCELERATOR': 'Accelerator Track',
      'CATALYST_TRACK': 'Catalyst Track',
    };

    const offerDescriptions: Record<string, string> = {
      'FULL_SUPPORT': 'You qualify for our full support program with weekly stipend and intensive training.',
      'SKILLS_ONLY': 'Focus on skill development with our comprehensive training program.',
      'ACCELERATOR': 'Fast-track your journey with market-focused missions and client work.',
      'CATALYST_TRACK': 'Lead the way — build your income and mentor others.',
    };

    const focusLabels: Record<string, string> = {
      'TECHNICAL': 'Technical Skills',
      'SOFT': 'Soft Skills',
      'COMMERCIAL': 'Commercial Awareness',
    };

    const offerLabel = offerLabels[data.offerType] || data.offerType;
    const offerDescription = offerDescriptions[data.offerType] || '';
    const focusLabel = focusLabels[data.primaryFocus] || data.primaryFocus;

    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #fafafa;">
        <div style="background: #02213D; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎯 Your Project 3:10 Offer</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Personalized just for you, ${data.firstName}</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <!-- Skill Triad Visualization -->
          <h2 style="color: #02213D; margin-top: 0;">Your Starting Position</h2>
          
          <div style="margin: 20px 0;">
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: 600;">Technical</span>
                <span style="color: #666;">${Math.round(data.triadTechnical)}%</span>
              </div>
              <div style="background: #e5e5e5; border-radius: 4px; height: 12px; overflow: hidden;">
                <div style="background: #3B82F6; height: 100%; width: ${data.triadTechnical}%; border-radius: 4px;"></div>
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: 600;">Soft Skills</span>
                <span style="color: #666;">${Math.round(data.triadSoft)}%</span>
              </div>
              <div style="background: #e5e5e5; border-radius: 4px; height: 12px; overflow: hidden;">
                <div style="background: #10B981; height: 100%; width: ${data.triadSoft}%; border-radius: 4px;"></div>
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-weight: 600;">Commercial</span>
                <span style="color: #666;">${Math.round(data.triadCommercial)}%</span>
              </div>
              <div style="background: #e5e5e5; border-radius: 4px; height: 12px; overflow: hidden;">
                <div style="background: #C4A052; height: 100%; width: ${data.triadCommercial}%; border-radius: 4px;"></div>
              </div>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 0;">
            Your main focus area: <strong style="color: #02213D;">${focusLabel}</strong>
          </p>

          <!-- Offer Type -->
          <div style="background: linear-gradient(135deg, #02213D 0%, #1a3a5c 100%); color: white; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <h3 style="margin: 0 0 10px 0; font-size: 20px;">${offerLabel}</h3>
            <p style="margin: 0; opacity: 0.9;">${offerDescription}</p>
            ${data.receivesStipend ? '<p style="margin: 15px 0 0 0; font-size: 14px; background: rgba(196, 160, 82, 0.3); padding: 8px 12px; border-radius: 6px; display: inline-block;">✅ Includes weekly stipend</p>' : ''}
          </div>

          <!-- Journey Details -->
          <h3 style="color: #02213D;">Your 90-Day Journey</h3>
          <ul style="color: #444; line-height: 1.8;">
            <li>Focus on <strong>${focusLabel}</strong> development</li>
            <li>Weekly missions aligned to your growth areas</li>
            <li>Daily momentum tracking and community support</li>
            ${data.receivesStipend ? '<li>Weekly stipend upon meeting KPIs</li>' : ''}
          </ul>

          <!-- CTA Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.acceptLink}" style="background: #C4A052; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-bottom: 15px;">
              ✅ Accept My Offer
            </a>
            <br/>
            <a href="${data.declineLink}" style="color: #666; font-size: 14px; text-decoration: underline;">
              I need to decline at this time
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            This offer expires in 7 days. Questions? Reply to this email.
          </p>
        </div>
        
        <p style="color: #666; text-align: center; margin-top: 20px; font-size: 14px;">
          — The Project 3:10 Team
        </p>
      </div>
    `;

    // If no API key, log to console (dev mode)
    if (!this.resendApiKey) {
      console.log('📧 [DEV] Offer Email would be sent:');
      console.log(`To: ${email}`);
      console.log(`Subject: Your Project 3:10 Offer — ${offerLabel}`);
      console.log('Data:', data);
      return true;
    }

    // Send via Resend API
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: email,
          subject: `Your Project 3:10 Offer — ${offerLabel}`,
          html,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend API error: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send offer email:', error);
      return false;
    }
  }
}
