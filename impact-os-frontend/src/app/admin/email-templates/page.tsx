'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Clock, Check, AlertTriangle, Archive, Loader2, Eye, PenSquare, CheckCircle2, XCircle } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import styles from './page.module.css';
import { EmailTemplate } from './types';
import { mockTemplates } from './mockTemplates';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Check }> = {
    DRAFT: { label: 'Draft', color: 'var(--text-tertiary)', icon: Clock },
    PENDING_APPROVAL: { label: 'Pending Approval', color: 'var(--gold-warm)', icon: AlertTriangle },
    APPROVED: { label: 'Approved', color: 'var(--accent-success)', icon: Check },
    DEPRECATED: { label: 'Deprecated', color: 'var(--accent-danger)', icon: Archive },
};

const CATEGORY_LABELS: Record<string, string> = {
    INTAKE: 'Application Intake',
    ADMISSION: 'Admission & Decisions',
    AUTH: 'Authentication',
    STAFF: 'Staff Management',
    SUPPORT: 'Support Requests',
    MISSION: 'Mission Notifications',
    BROADCAST: 'Broadcast Messages',
    SYSTEM: 'System Emails',
};


export default function AdminEmailTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string>('');
    const [processing, setProcessing] = useState<string | null>(null);

    // Fetch templates
    useEffect(() => {
        async function fetchTemplates() {
            try {
                const res = await fetch(`${API_BASE}/email-templates`);
                if (res.ok) {
                    const data = await res.json();
                    // Use mock data if API returns empty (dev mode)
                    setTemplates(data.length > 0 ? data : mockTemplates);
                } else if (process.env.NODE_ENV !== 'production') {
                    setTemplates(mockTemplates);
                }
            } catch (error) {
                console.error('Failed to fetch templates:', error);
                if (process.env.NODE_ENV !== 'production') {
                    setTemplates(mockTemplates);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchTemplates();
    }, []);

    const filteredTemplates = templates.filter(t => {
        if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
        return true;
    });

    // Group by category
    const groupedTemplates = filteredTemplates.reduce((acc, template) => {
        const category = template.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(template);
        return acc;
    }, {} as Record<string, EmailTemplate[]>);

    const handlePreview = async (template: EmailTemplate) => {
        setPreviewTemplate(template);
        try {
            const res = await fetch(`${API_BASE}/email-templates/${template.id}/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: {} }),
            });
            if (res.ok) {
                const preview = await res.json();
                setPreviewHtml(preview.html);
            } else {
                setPreviewHtml(template.htmlContent);
            }
        } catch {
            setPreviewHtml(template.htmlContent);
        }
    };

    const handleApprove = async (template: EmailTemplate) => {
        setProcessing(template.id);
        try {
            const res = await fetch(`${API_BASE}/email-templates/${template.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approvedBy: 'admin' }),
            });
            if (res.ok) {
                const updated = await res.json();
                setTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
            }
        } catch (error) {
            console.error('Failed to approve template:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (template: EmailTemplate) => {
        setProcessing(template.id);
        try {
            const res = await fetch(`${API_BASE}/email-templates/${template.id}/reject`, {
                method: 'POST',
            });
            if (res.ok) {
                const updated = await res.json();
                setTemplates(prev => prev.map(t => t.id === template.id ? updated : t));
            }
        } catch (error) {
            console.error('Failed to reject template:', error);
        } finally {
            setProcessing(null);
        }
    };

    const pendingCount = templates.filter(t => t.status === 'PENDING_APPROVAL').length;

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <Loader2 className={styles.spinner} />
                <p>Loading templates...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Page Header with Section Tabs */}
            <PageHeader
                title="Communications"
                subtitle="Manage email templates and track delivery"
                tabs={[
                    {
                        key: 'templates',
                        label: 'Email Templates',
                        icon: <PenSquare size={18} />,
                        active: true,
                    },
                    {
                        key: 'log',
                        label: 'Email Log',
                        icon: <Mail size={18} />,
                        href: '/admin/communications',
                    },
                ]}
                actions={
                    pendingCount > 0 ? (
                        <div className={styles.pendingAlert}>
                            <AlertTriangle size={18} />
                            {pendingCount} template{pendingCount > 1 ? 's' : ''} pending approval
                        </div>
                    ) : undefined
                }
            />

            {/* Filters */}
            <div className={styles.filtersBar}>
                <Select
                    value={categoryFilter}
                    onChange={(value) => setCategoryFilter(value)}
                    options={[
                        { value: 'ALL', label: 'All Categories' },
                        ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
                            value: key,
                            label,
                        })),
                    ]}
                />
                <Select
                    value={statusFilter}
                    onChange={(value) => setStatusFilter(value)}
                    options={[
                        { value: 'ALL', label: 'All Status' },
                        { value: 'DRAFT', label: 'Draft' },
                        { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
                        { value: 'APPROVED', label: 'Approved' },
                        { value: 'DEPRECATED', label: 'Deprecated' },
                    ]}
                />
            </div>

            {/* Templates by Category */}
            <div className={styles.content}>
                {Object.entries(groupedTemplates).length === 0 ? (
                    <div className={styles.emptyState}>
                        <Mail size={48} />
                        <h3>No templates found</h3>
                        <p>Run the seed script to populate email templates</p>
                    </div>
                ) : (
                    Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                        <div key={category} className={styles.categorySection}>
                            <h2 className={styles.categoryTitle}>
                                {CATEGORY_LABELS[category] || category}
                            </h2>
                            <div className={styles.templateGrid}>
                                {categoryTemplates.map(template => (
                                    <div
                                        key={template.id}
                                        className={`${styles.templateCard} ${template.status === 'PENDING_APPROVAL' ? styles.pending : ''}`}
                                    >
                                        <div className={styles.cardHeader}>
                                            <div className={styles.cardTitle}>
                                                <h3>{template.name}</h3>
                                                <span className={styles.slug}>{template.slug}</span>
                                            </div>
                                            <span
                                                className={styles.statusBadge}
                                                style={{ background: STATUS_CONFIG[template.status]?.color || 'var(--text-tertiary)' }}
                                            >
                                                {STATUS_CONFIG[template.status]?.label || template.status}
                                            </span>
                                        </div>

                                        {template.description && (
                                            <p className={styles.description}>{template.description}</p>
                                        )}

                                        <div className={styles.subject}>
                                            <strong>Subject:</strong> {template.subject}
                                        </div>

                                        <div className={styles.cardMeta}>
                                            <span>v{template.version}</span>
                                            {template.isSystem && <span className={styles.systemBadge}>System</span>}
                                        </div>

                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handlePreview(template)}
                                            >
                                                <Eye size={16} />
                                                Preview
                                            </button>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => router.push(`/admin/email-templates/${template.id}`)}
                                            >
                                                <PenSquare size={16} />
                                                Edit
                                            </button>
                                            {template.status === 'PENDING_APPROVAL' && (
                                                <>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.approveButton}`}
                                                        onClick={() => handleApprove(template)}
                                                        disabled={processing === template.id}
                                                    >
                                                        {processing === template.id ? (
                                                            <Loader2 size={16} className={styles.spinner} />
                                                        ) : (
                                                            <CheckCircle2 size={16} />
                                                        )}
                                                        Approve
                                                    </button>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.rejectButton}`}
                                                        onClick={() => handleReject(template)}
                                                        disabled={processing === template.id}
                                                    >
                                                        <XCircle size={16} />
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Preview Modal */}
            {previewTemplate && (
                <div className={styles.modalOverlay} onClick={() => setPreviewTemplate(null)}>
                    <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h2>{previewTemplate.name}</h2>
                                <p className={styles.previewSubject}>Subject: {previewTemplate.subject}</p>
                            </div>
                            <button className={styles.closeButton} onClick={() => setPreviewTemplate(null)}>
                                ×
                            </button>
                        </div>
                        <div className={styles.previewContent}>
                            <iframe
                                srcDoc={previewHtml}
                                title="Email Preview"
                                className={styles.previewFrame}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
