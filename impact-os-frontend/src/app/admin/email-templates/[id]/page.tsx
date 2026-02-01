'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Eye, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface TemplateVariable {
    name: string;
    description: string;
    required: boolean;
}

interface EmailTemplate {
    id: string;
    slug: string;
    name: string;
    description?: string;
    category: string;
    subject: string;
    htmlContent: string;
    variables: TemplateVariable[];
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DEPRECATED';
    version: number;
    isSystem: boolean;
    previousSubject?: string;
    previousHtml?: string;
}

const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Approval',
    APPROVED: 'Approved',
    DEPRECATED: 'Deprecated',
};

export default function EmailTemplateEditorPage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<EmailTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [showPreview, setShowPreview] = useState(false);

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
                    router.push('/admin/email-templates');
                }
            } catch (error) {
                console.error('Failed to fetch template:', error);
                router.push('/admin/email-templates');
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
                body: JSON.stringify({
                    subject,
                    htmlContent,
                    description,
                }),
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

    const handlePreview = async () => {
        try {
            const res = await fetch(`${API_BASE}/email-templates/${templateId}/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: {} }),
            });
            if (res.ok) {
                const preview = await res.json();
                setPreviewHtml(preview.html);
            } else {
                // Fallback to current content
                setPreviewHtml(htmlContent);
            }
        } catch {
            setPreviewHtml(htmlContent);
        }
        setShowPreview(true);
    };

    const insertVariable = (varName: string) => {
        const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newValue = `${before}{{${varName}}}${after}`;
            setHtmlContent(newValue);
            // Focus back on textarea
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + varName.length + 4, start + varName.length + 4);
            }, 0);
        }
    };

    const hasChanges = template && (
        subject !== template.subject ||
        htmlContent !== template.htmlContent ||
        description !== (template.description || '')
    );

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <Loader2 className={styles.spinner} />
                <p>Loading template...</p>
            </div>
        );
    }

    if (!template) {
        return null;
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={() => router.push('/admin/email-templates')}>
                    <ArrowLeft size={18} />
                    Back
                </button>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>{template.name}</h1>
                    <div className={styles.meta}>
                        <span className={styles.slug}>{template.slug}</span>
                        <span
                            className={styles.statusBadge}
                            data-status={template.status}
                        >
                            {STATUS_LABELS[template.status]}
                        </span>
                        <span className={styles.version}>v{template.version}</span>
                    </div>
                </div>
                <div className={styles.actions}>
                    <button className={styles.previewButton} onClick={handlePreview}>
                        <Eye size={16} />
                        Preview
                    </button>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                    >
                        {saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Status Alert */}
            {template.status === 'APPROVED' && hasChanges && (
                <div className={styles.alert} data-type="warning">
                    <AlertTriangle size={18} />
                    <span>Saving changes will mark this template as &quot;Pending Approval&quot;. The current approved version will continue to be used until the new version is approved.</span>
                </div>
            )}

            {template.status === 'PENDING_APPROVAL' && (
                <div className={styles.alert} data-type="info">
                    <Info size={18} />
                    <span>This template has pending changes awaiting approval. The previous approved version is still active.</span>
                </div>
            )}

            {/* Editor */}
            <div className={styles.editorLayout}>
                <div className={styles.editorMain}>
                    {/* Description */}
                    <div className={styles.field}>
                        <label>Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of when this email is sent..."
                        />
                    </div>

                    {/* Subject */}
                    <div className={styles.field}>
                        <label>Subject Line</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Email subject..."
                        />
                    </div>

                    {/* HTML Content */}
                    <div className={styles.field}>
                        <label>HTML Content</label>
                        <textarea
                            id="htmlContent"
                            value={htmlContent}
                            onChange={(e) => setHtmlContent(e.target.value)}
                            rows={20}
                            placeholder="Email HTML content..."
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    {/* Variables */}
                    <div className={styles.sidebarSection}>
                        <h3>Available Variables</h3>
                        <p className={styles.sidebarHint}>Click to insert at cursor position</p>
                        <div className={styles.variablesList}>
                            {(template.variables || []).map((v) => (
                                <button
                                    key={v.name}
                                    className={styles.variableButton}
                                    onClick={() => insertVariable(v.name)}
                                    title={v.description}
                                >
                                    <code>{`{{${v.name}}}`}</code>
                                    {v.required && <span className={styles.required}>*</span>}
                                </button>
                            ))}
                            {(template.variables || []).length === 0 && (
                                <p className={styles.noVariables}>No variables defined</p>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className={styles.sidebarSection}>
                        <h3>Template Info</h3>
                        <dl className={styles.infoList}>
                            <dt>Category</dt>
                            <dd>{template.category}</dd>
                            <dt>System Template</dt>
                            <dd>{template.isSystem ? 'Yes' : 'No'}</dd>
                            <dt>Version</dt>
                            <dd>{template.version}</dd>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div className={styles.modalOverlay} onClick={() => setShowPreview(false)}>
                    <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h2>Email Preview</h2>
                                <p className={styles.previewSubject}>Subject: {subject}</p>
                            </div>
                            <button className={styles.closeButton} onClick={() => setShowPreview(false)}>
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
