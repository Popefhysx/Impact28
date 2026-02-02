export interface TemplateVariable {
    name: string;
    description: string;
    required: boolean;
}

export interface EmailTemplate {
    id: string;
    slug: string;
    name: string;
    description?: string;
    category: string;
    subject: string;
    htmlContent: string;
    variables?: TemplateVariable[];
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DEPRECATED';
    version: number;
    isSystem: boolean;
    approvedAt?: string;
    approvedBy?: string;
    previousSubject?: string;
    previousHtml?: string;
    createdAt: string;
    updatedAt: string;
}
