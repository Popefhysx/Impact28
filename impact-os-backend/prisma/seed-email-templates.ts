import { PrismaClient, CommunicationSource, TemplateStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface TemplateSeed {
    slug: string;
    name: string;
    description: string;
    category: CommunicationSource;
    subject: string;
    htmlContent: string;
    variables: Array<{ name: string; description: string; required: boolean }>;
    isSystem: boolean;
}

const templates: TemplateSeed[] = [
    {
        slug: 'application_received',
        name: 'Application Received',
        description: 'Sent when a new application is submitted',
        category: CommunicationSource.INTAKE,
        subject: `We've received your application, {{firstName}}! 🎉`,
        htmlContent: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #02213D;">Application Received!</h1>
  
  <p>Hi {{firstName}},</p>
  
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
</div>`,
        variables: [
            { name: 'firstName', description: 'Applicant first name', required: true },
        ],
        isSystem: true,
    },
    {
        slug: 'application_reminder',
        name: 'Application Reminder',
        description: 'Sent to remind applicants to complete their application',
        category: CommunicationSource.INTAKE,
        subject: `Don't forget to complete your application, {{firstName}}!`,
        htmlContent: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #02213D;">Your application is waiting ⏳</h1>
  
  <p>Hi {{firstName}},</p>
  
  <p>You started your Project 3:10 application but haven't finished it yet. Don't let this opportunity slip away!</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resumeLink}}" style="background: #C4A052; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Continue My Application →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
  
  <p style="color: #666;">— The Project 3:10 Team</p>
</div>`,
        variables: [
            { name: 'firstName', description: 'Applicant first name', required: true },
            { name: 'resumeLink', description: 'Link to continue application', required: true },
        ],
        isSystem: true,
    },
    {
        slug: 'application_admitted',
        name: 'Application Admitted',
        description: 'Sent when an applicant is admitted to the program',
        category: CommunicationSource.ADMISSION,
        subject: `🎉 Congratulations {{firstName}}! You're in!`,
        htmlContent: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #02213D;">Welcome to Project 3:10! 🚀</h1>
  
  <p>Hi {{firstName}},</p>
  
  <p><strong>Congratulations!</strong> You've been admitted to Project 3:10{{#if cohortName}} — {{cohortName}}{{/if}}.</p>
  
  {{#if skillTrack}}<p>Your track: <strong>{{skillTrack}}</strong></p>{{/if}}
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Your next steps:</h3>
    <ol style="margin-bottom: 0;">
      <li>Access your dashboard</li>
      <li>Complete your profile</li>
      <li>Start your first mission</li>
    </ol>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboardLink}}" style="background: #C4A052; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Access My Dashboard →
    </a>
  </div>
  
  <p>Remember: <strong>From potential to paycheck.</strong> Your journey starts now.</p>
  
  <p style="color: #666;">— The Project 3:10 Team</p>
</div>`,
        variables: [
            { name: 'firstName', description: 'Applicant first name', required: true },
            { name: 'dashboardLink', description: 'Link to participant dashboard', required: true },
            { name: 'skillTrack', description: 'Assigned skill track', required: false },
            { name: 'cohortName', description: 'Cohort name', required: false },
        ],
        isSystem: true,
    },
    {
        slug: 'application_conditional',
        name: 'Application Conditional Admission',
        description: 'Sent when an applicant is conditionally admitted with pre-work',
        category: CommunicationSource.ADMISSION,
        subject: `Almost there, {{firstName}}! One more step...`,
        htmlContent: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #02213D;">You're almost in! 🎯</h1>
  
  <p>Hi {{firstName}},</p>
  
  <p>We've reviewed your application and we see potential in you. However, before we can fully admit you, we need you to complete one pre-work task.</p>
  
  <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #C4A052;">
    <h3 style="margin-top: 0;">Your Pre-Work Task:</h3>
    <p style="margin-bottom: 0;">{{preWorkTask}}</p>
  </div>
  
  <p><strong>Deadline:</strong> 7 days from now</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboardLink}}" style="background: #C4A052; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Complete My Task →
    </a>
  </div>
  
  <p style="color: #666;">— The Project 3:10 Team</p>
</div>`,
        variables: [
            { name: 'firstName', description: 'Applicant first name', required: true },
            { name: 'dashboardLink', description: 'Link to complete task', required: true },
            { name: 'preWorkTask', description: 'Description of pre-work task', required: true },
        ],
        isSystem: true,
    },
    {
        slug: 'application_rejected',
        name: 'Application Rejected',
        description: 'Sent when an application is rejected',
        category: CommunicationSource.ADMISSION,
        subject: `Update on your Project 3:10 application`,
        htmlContent: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #02213D;">Thank you for applying</h1>
  
  <p>Hi {{firstName}},</p>
  
  <p>After careful review, we're unable to offer you a spot in Project 3:10 at this time.</p>
  
  {{#if rejectionReason}}
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Reason:</strong> {{rejectionReason}}</p>
  </div>
  {{/if}}
  
  <p>This doesn't mean you can't succeed. Here are some free resources to help you get started:</p>
  
  <ul>
    <li><a href="https://www.youtube.com/@Cycle28Official">Our YouTube Channel</a> — Free tutorials</li>
    <li><a href="https://cycle28.org/resources">Resource Library</a> — Guides and tools</li>
  </ul>
  
  <p>You're welcome to reapply in the future after building more experience.</p>
  
  <p style="color: #666;">— The Project 3:10 Team</p>
</div>`,
        variables: [
            { name: 'firstName', description: 'Applicant first name', required: true },
            { name: 'rejectionReason', description: 'Reason for rejection', required: false },
        ],
        isSystem: true,
    },
    {
        slug: 'resume_link',
        name: 'Resume Application Link',
        description: 'Sent when applicant requests a link to continue their application',
        category: CommunicationSource.INTAKE,
        subject: `Continue your application, {{firstName}}`,
        htmlContent: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #02213D;">Here's your resume link 🔗</h1>
  
  <p>Hi {{firstName}},</p>
  
  <p>You requested a link to continue your Project 3:10 application. Click below to pick up where you left off:</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{resumeLink}}" style="background: #C4A052; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
      Continue My Application →
    </a>
  </div>
  
  <p style="color: #666; font-size: 14px;">This link expires in 7 days. If you didn't request this, you can ignore this email.</p>
  
  <p style="color: #666;">— The Project 3:10 Team</p>
</div>`,
        variables: [
            { name: 'firstName', description: 'Applicant first name', required: true },
            { name: 'resumeLink', description: 'Link to continue application', required: true },
        ],
        isSystem: true,
    },
    {
        slug: 'otp_verification',
        name: 'OTP Verification',
        description: 'Sent for login verification with OTP code',
        category: CommunicationSource.AUTH,
        subject: `{{otpCode}} — Your Project 3:10 Login Code`,
        htmlContent: `
<div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #02213D; margin: 0; font-size: 24px;">Project 3:10</h1>
  </div>
  
  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    Hi {{firstName}},
  </p>
  
  <p style="color: #333; font-size: 16px; line-height: 1.6;">
    Use this code to log in to your dashboard:
  </p>
  
  <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #02213D;">
      {{otpCode}}
    </span>
  </div>
  
  <p style="color: #666; font-size: 14px; text-align: center;">
    This code expires in {{expiryMinutes}} minutes.
  </p>
  
  <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
    If you didn't request this code, you can safely ignore this email.
  </p>
</div>`,
        variables: [
            { name: 'firstName', description: 'User first name', required: true },
            { name: 'otpCode', description: 'One-time password code', required: true },
            { name: 'expiryMinutes', description: 'Minutes until code expires', required: true },
        ],
        isSystem: true,
    },
    {
        slug: 'staff_invite',
        name: 'Staff Invite',
        description: 'Sent when a new staff member is invited to the platform',
        category: CommunicationSource.STAFF,
        subject: `You're invited to join Project 3:10 as {{categoryLabel}}`,
        htmlContent: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #02213D; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 24px;">You're Invited to Project 3:10</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Staff Portal Access</p>
  </div>

  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5; border-top: none;">
    <p style="color: #333; font-size: 16px; line-height: 1.6;">
      {{#if inviterName}}<strong>{{inviterName}}</strong> has invited you{{else}}You have been invited{{/if}} 
      to join the Project 3:10 staff team.
    </p>
    
    <div style="background: linear-gradient(135deg, #02213D 0%, #1a3a5c 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px;">{{categoryLabel}}</h3>
      <p style="margin: 0; opacity: 0.9; font-size: 14px;">{{categoryDescription}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{setupLink}}" style="background: #C4A052; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Complete Your Setup →
      </a>
    </div>
    
    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>What happens next?</strong><br/>
        1. Click the button above to set up your account<br/>
        2. Complete your profile<br/>
        3. Access your staff dashboard
      </p>
    </div>
    
    <p style="color: #999; font-size: 12px; margin-top: 20px;">
      This invitation link expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
  
  <p style="color: #666; text-align: center; margin-top: 20px; font-size: 14px;">
    — The Project 3:10 Team
  </p>
</div>`,
        variables: [
            { name: 'inviterName', description: 'Name of person who sent invite', required: false },
            { name: 'categoryLabel', description: 'Role label (Administrator, Staff, Observer)', required: true },
            { name: 'categoryDescription', description: 'Description of role permissions', required: true },
            { name: 'setupLink', description: 'Link to complete account setup', required: true },
        ],
        isSystem: true,
    },
];

async function seedTemplates() {
    console.log('🌱 Seeding email templates...');

    for (const template of templates) {
        const existing = await prisma.communicationTemplate.findUnique({
            where: { slug: template.slug },
        });

        if (existing) {
            console.log(`  ↺ Skipping ${template.slug} (already exists)`);
            continue;
        }

        await prisma.communicationTemplate.create({
            data: {
                slug: template.slug,
                name: template.name,
                description: template.description,
                category: template.category,
                subject: template.subject,
                htmlContent: template.htmlContent,
                variables: template.variables,
                isSystem: template.isSystem,
                status: TemplateStatus.APPROVED,
                approvedAt: new Date(),
                version: 1,
            },
        });

        console.log(`  ✓ Created ${template.slug}`);
    }

    console.log('✅ Email templates seeded successfully!');
}

seedTemplates()
    .catch((e) => {
        console.error('Error seeding templates:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
