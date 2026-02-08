'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Save, Loader2, AlertTriangle, Info, Send } from 'lucide-react';
import { PageHeader, RichTextEditor, EditorVariable } from '@/components/ui';
import { useToast } from '@/components/admin/Toast';
import styles from './page.module.css';
import { EmailTemplate } from '../types';
import { getMockTemplate } from '../mockTemplates';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    DEPRECATED: 'Deprecated',
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

export default function EmailTemplateEditorPage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params.id as string;
    const { showToast } = useToast();

    const [template, setTemplate] = useState<EmailTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isMockMode, setIsMockMode] = useState(false);

    // Form state
    const [subject, setSubject] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [description, setDescription] = useState('');

    // Fetch template
    useEffect(() => {
        async function fetchTemplate() {
            try {
                const res = await fetch(`${API_BASE}/email-templates/${templateId}`);
                if (res.ok) {
                    const data = await res.json();
                    setTemplate(data);
                    setSubject(data.subject);
                    setHtmlContent(data.htmlContent);
                    setDescription(data.description || '');
                } else {
                    const mockTemplate = getMockTemplate(templateId);
                    if (mockTemplate) {
                        setTemplate(mockTemplate);
                        setSubject(mockTemplate.subject);
                        setHtmlContent(mockTemplate.htmlContent);
                        setDescription(mockTemplate.description || '');
                        setIsMockMode(true);
                    } else {
                        router.push('/admin/email-templates');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch template:', error);
                const mockTemplate = getMockTemplate(templateId);
                if (mockTemplate) {
                    setTemplate(mockTemplate);
                    setSubject(mockTemplate.subject);
                    setHtmlContent(mockTemplate.htmlContent);
                    setDescription(mockTemplate.description || '');
                    setIsMockMode(true);
                } else {
                    router.push('/admin/email-templates');
                }
            } finally {
                setLoading(false);
            }
        }
        fetchTemplate();
    }, [templateId, router]);

    const handleSave = async () => {
        if (!template) return;
        setSaving(true);

        try {
            const res = await fetch(`${API_BASE}/email-templates/${templateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, htmlContent, description }),
            });

            if (res.ok) {
                const updated = await res.json();
                setTemplate(updated);
            }
        } catch (error) {
            console.error('Failed to save template:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitForApproval = async () => {
        await handleSave();
        showToast('success', 'Template submitted for approval!');
    };

    const hasChanges = template && (
        subject !== template.subject ||
        htmlContent !== template.htmlContent ||
        description !== (template.description || '')
    );

    // Convert template variables to EditorVariable format
    const editorVariables: EditorVariable[] = (template?.variables || []).map(v => ({
        name: v.name,
        description: v.description,
        required: v.required,
    }));

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <Loader2 className={styles.spinner} size={32} />
                <p>Loading template...</p>
            </div>
        );
    }

    if (!template) {
        return null;
    }

    return (
        <div className={styles.container}>
            {/* Back Button */}
            <div className={styles.backNav}>
                <button className={styles.backButton} onClick={() => router.push('/admin/email-templates')}>
                    ← Back to Templates
                </button>
            </div>

            {/* Page Header */}
            <PageHeader
                actions={
                    <>
                        {hasChanges && (
                            <span className={styles.unsavedBadge}>Unsaved</span>
                        )}
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                        >
                            {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                        {template.status === 'DRAFT' && (
                            <button
                                className={styles.publishButton}
                                onClick={handleSubmitForApproval}
                                disabled={saving}
                            >
                                <Send size={16} />
                                Submit for Approval
                            </button>
                        )}
                    </>
                }
            />

            {/* Main Content */}
            <div className={styles.content}>
                {/* Status Alert */}
                {template.status === 'APPROVED' && hasChanges && (
                    <div className={styles.alert} data-type="warning">
                        <AlertTriangle size={18} />
                        <span>Saving changes will mark this template as "Pending Approval".</span>
                    </div>
                )}

                {template.status === 'PENDING_APPROVAL' && (
                    <div className={styles.alert} data-type="info">
                        <Info size={18} />
                        <span>This template has pending changes awaiting approval.</span>
                    </div>
                )}

                {/* Template Metadata */}
                <div className={styles.metadata}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Slug</span>
                        <code className={styles.metaCode}>{template.slug}</code>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Category</span>
                        <span className={styles.metaValue}>{CATEGORY_LABELS[template.category] || template.category}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Status</span>
                        <span className={styles.statusBadge} data-status={template.status}>
                            {STATUS_LABELS[template.status]}
                        </span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Version</span>
                        <span className={styles.metaValue}>v{template.version}</span>
                    </div>
                </div>

                {/* Subject Line */}
                <div className={styles.field}>
                    <label className={styles.fieldLabel}>Subject Line</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Email subject..."
                        className={styles.fieldInput}
                    />
                </div>

                {/* Rich Text Editor */}
                <div className={styles.editorWrapper}>
                    <label className={styles.fieldLabel}>Email Content</label>
                    <RichTextEditor
                        value={htmlContent}
                        onChange={setHtmlContent}
                        variables={editorVariables}
                        placeholder="Enter your email HTML content..."
                        minHeight={500}
                    />
                </div>
            </div>
        </div>
    );
}
