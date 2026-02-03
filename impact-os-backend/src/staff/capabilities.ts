/**
 * Staff Capabilities
 *
 * Defines all capability keys and pre-built role templates.
 * Capabilities follow the pattern: domain.action
 */

export const CAPABILITIES = {
  // Program
  CALENDAR_MANAGE: 'calendar.manage',
  COHORT_MANAGE: 'cohort.manage',
  ADMISSIONS_MANAGE: 'admissions.manage',

  // People
  STAFF_INVITE: 'staff.invite',
  STAFF_ASSIGN: 'staff.assign',
  PARTICIPANTS_VIEW: 'participants.view',

  // Support
  SUPPORT_APPROVE: 'support.approve',
  WALLET_VIEW: 'wallet.view',
  VOUCHERS_ISSUE: 'vouchers.issue',

  // Income
  INCOME_REVIEW: 'income.review',
  INCOME_APPROVE: 'income.approve',

  // Comms
  COMMS_BROADCAST: 'comms.broadcast',
  COMMS_DIRECT: 'comms.direct',
  COMMS_TEMPLATES: 'comms.templates',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  AUDIT_VIEW: 'audit.view',

  // System
  SETTINGS_GLOBAL: 'settings.global',
  EMERGENCY_OVERRIDE: 'emergency.override',
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

/**
 * Capability groups for UI organization
 */
export const CAPABILITY_GROUPS = {
  program: {
    label: 'Program',
    capabilities: [
      CAPABILITIES.CALENDAR_MANAGE,
      CAPABILITIES.COHORT_MANAGE,
      CAPABILITIES.ADMISSIONS_MANAGE,
    ],
  },
  people: {
    label: 'People',
    capabilities: [
      CAPABILITIES.STAFF_INVITE,
      CAPABILITIES.STAFF_ASSIGN,
      CAPABILITIES.PARTICIPANTS_VIEW,
    ],
  },
  support: {
    label: 'Support',
    capabilities: [
      CAPABILITIES.SUPPORT_APPROVE,
      CAPABILITIES.WALLET_VIEW,
      CAPABILITIES.VOUCHERS_ISSUE,
    ],
  },
  income: {
    label: 'Income',
    capabilities: [CAPABILITIES.INCOME_REVIEW, CAPABILITIES.INCOME_APPROVE],
  },
  comms: {
    label: 'Communications',
    capabilities: [
      CAPABILITIES.COMMS_BROADCAST,
      CAPABILITIES.COMMS_DIRECT,
      CAPABILITIES.COMMS_TEMPLATES,
    ],
  },
  reports: {
    label: 'Reports',
    capabilities: [
      CAPABILITIES.REPORTS_VIEW,
      CAPABILITIES.REPORTS_EXPORT,
      CAPABILITIES.AUDIT_VIEW,
    ],
  },
  system: {
    label: 'System',
    capabilities: [
      CAPABILITIES.SETTINGS_GLOBAL,
      CAPABILITIES.EMERGENCY_OVERRIDE,
    ],
  },
};

/**
 * Pre-built capability templates for common roles
 */
export const CAPABILITY_TEMPLATES = {
  MENTOR: {
    label: 'Mentor',
    description: 'View participants and communicate directly',
    capabilities: [
      CAPABILITIES.PARTICIPANTS_VIEW,
      CAPABILITIES.COMMS_DIRECT,
      CAPABILITIES.COMMS_TEMPLATES,
    ],
  },
  OPS: {
    label: 'Operations',
    description: 'Manage admissions and support requests',
    capabilities: [
      CAPABILITIES.ADMISSIONS_MANAGE,
      CAPABILITIES.SUPPORT_APPROVE,
      CAPABILITIES.COMMS_BROADCAST,
      CAPABILITIES.PARTICIPANTS_VIEW,
    ],
  },
  FINANCE: {
    label: 'Finance',
    description: 'Manage support budgets and disbursements',
    capabilities: [
      CAPABILITIES.SUPPORT_APPROVE,
      CAPABILITIES.WALLET_VIEW,
      CAPABILITIES.VOUCHERS_ISSUE,
    ],
  },
  VOLUNTEER: {
    label: 'Volunteer',
    description: 'Task-only access with no system features',
    capabilities: [],
  },
  IMPACT: {
    label: 'Impact / M&E',
    description: 'View and export reports',
    capabilities: [CAPABILITIES.REPORTS_VIEW, CAPABILITIES.REPORTS_EXPORT],
  },
  PARTNER: {
    label: 'Partner',
    description: 'View reports scoped to funding',
    capabilities: [CAPABILITIES.REPORTS_VIEW],
  },
} as const;

export type CapabilityTemplateId = keyof typeof CAPABILITY_TEMPLATES;
