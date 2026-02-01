'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Send, User, Users, Loader2, Bold, Italic, Link as LinkIcon, List, AlignLeft, Eye, Save, X, UsersRound, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/ui/Select';
import styles from './page.module.css';

interface Recipient {
    id: string;
    name: string;
    email: string;
    type?: 'user' | 'applicant';
}

interface Template {
    id: string;
    name: string;
    slug: string;
    subject: string;
    htmlContent: string;
    category: string;
}

interface Cohort {
    id: string;
    name: string;
}

type SegmentType = 'individual' | 'all' | 'cohort' | 'phase';

const PHASES = [
    { value: 'ONBOARDING', label: 'Onboarding' },
    { value: 'WEEK_1', label: 'Week 1' },
    { value: 'WEEK_2', label: 'Week 2' },
    { value: 'WEEK_3', label: 'Week 3' },
    { value: 'SCALING', label: 'Scaling' },
    { value: 'GRADUATED', label: 'Graduated' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ComposePage() {
    // Recipient mode
    const [segmentType, setSegmentType] = useState<SegmentType>('individual');
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Recipient[]>([]);
    const [searching, setSearching] = useState(false);

    // Segment options
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [selectedCohort, setSelectedCohort] = useState('');
    const [selectedPhase, setSelectedPhase] = useState('');
    const [segmentCount, setSegmentCount] = useState<number | null>(null);

    // Email content
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');

    // Templates
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');

    // UI State
    const [sending, setSending] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);

    // Load templates and cohorts
    useEffect(() => {
        fetch(`${API_BASE}/api/admin/communications/templates`)
            .then(res => res.json())
            .then(data => setTemplates(Array.isArray(data) ? data : []))
            .catch(console.error);

        fetch(`${API_BASE}/api/admin/communications/segments/cohorts`)
            .then(res => res.json())
            .then(data => setCohorts(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    // Search for individual recipients
    useEffect(() => {
        if (segmentType !== 'individual' || recipientSearch.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(`${API_BASE}/api/admin/communications/recipients/search?q=${encodeURIComponent(recipientSearch)}`);
                if (res.ok) {
                    const data = await res.json();
                    const filtered = data.filter((r: Recipient) => !recipients.find(existing => existing.email === r.email));
                    setSearchResults(filtered);
                }
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [recipientSearch, recipients, segmentType]);

    // Preview segment count
    useEffect(() => {
        if (segmentType === 'individual') {
            setSegmentCount(null);
            return;
        }

        const segment = getSegmentPayload();
        if (!segment) return;

        fetch(`${API_BASE}/api/admin/communications/segments/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(segment),
        })
            .then(res => res.json())
            .then(data => setSegmentCount(data.count))
            .catch(console.error);
    }, [segmentType, selectedCohort, selectedPhase]);

    const getSegmentPayload = () => {
        if (segmentType === 'all') {
            return { type: 'all' };
        } else if (segmentType === 'cohort' && selectedCohort) {
            return { type: 'cohort', cohortId: selectedCohort };
        } else if (segmentType === 'phase' && selectedPhase) {
            return { type: 'phase', phase: selectedPhase };
        }
        return null;
    };

    // Apply template
    const handleTemplateSelect = (slug: string) => {
        setSelectedTemplate(slug);
        const template = templates.find(t => t.slug === slug);
        if (template) {
            setSubject(template.subject);
            setContent(template.htmlContent);
        }
    };

    // Add/remove recipients
    const addRecipient = (recipient: Recipient) => {
        setRecipients(prev => [...prev, recipient]);
        setRecipientSearch('');
        setSearchResults([]);
    };

    const removeRecipient = (email: string) => {
        setRecipients(prev => prev.filter(r => r.email !== email));
    };

    // Insert variable
    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('email-content') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = content.substring(0, start) + `{{${variable}}}` + content.substring(end);
            setContent(newContent);
        }
    };

    // Send email
    const handleSend = async () => {
        if (!subject.trim() || !content.trim()) {
            alert('Please enter subject and content');
            return;
        }

        setSending(true);

        try {
            if (segmentType === 'individual') {
                if (recipients.length === 0) {
                    alert('Please add at least one recipient');
                    setSending(false);
                    return;
                }
                // For individual, use custom segment with recipient IDs
                const res = await fetch(`${API_BASE}/api/admin/communications/bulk-send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject,
                        htmlContent: content,
                        segment: { type: 'custom', customIds: recipients.map(r => r.id) },
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setSendSuccess(true);
                    setTimeout(() => setSendSuccess(false), 3000);
                } else {
                    alert(data.message || 'Send failed');
                }
            } else {
                const segment = getSegmentPayload();
                if (!segment) {
                    alert('Please select a segment');
                    setSending(false);
                    return;
                }
                const res = await fetch(`${API_BASE}/api/admin/communications/bulk-send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject,
                        htmlContent: content,
                        segment,
                    }),
                });
                const data = await res.json();
                if (data.success) {
                    setSendSuccess(true);
                    setTimeout(() => setSendSuccess(false), 3000);
                } else {
                    alert(data.message || 'Send failed');
                }
            }
        } catch (error) {
            console.error('Send error:', error);
            alert('Failed to send email');
        } finally {
            setSending(false);
        }
    };

    // Preview content
    const getPreviewHtml = () => {
        let html = content;
        html = html.replace(/\{\{firstName\}\}/g, 'John');
        html = html.replace(/\{\{lastName\}\}/g, 'Doe');
        html = html.replace(/\{\{email\}\}/g, 'john@example.com');
        return html;
    };

    const getRecipientCount = () => {
        if (segmentType === 'individual') return recipients.length;
        return segmentCount ?? 0;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin/communications" className={styles.backLink}>
                    <ArrowLeft size={18} />
                    Back to Communications
                </Link>
                <h1>Compose Email</h1>
            </header>

            <div className={styles.composeLayout}>
                {/* Main Editor */}
                <div className={styles.editorPane}>
                    {/* Recipient Mode Selector */}
                    <div className={styles.segmentSelector}>
                        <button
                            className={`${styles.segmentBtn} ${segmentType === 'individual' ? styles.active : ''}`}
                            onClick={() => setSegmentType('individual')}
                        >
                            <User size={16} />
                            Individual
                        </button>
                        <button
                            className={`${styles.segmentBtn} ${segmentType === 'all' ? styles.active : ''}`}
                            onClick={() => setSegmentType('all')}
                        >
                            <UsersRound size={16} />
                            All Participants
                        </button>
                        <button
                            className={`${styles.segmentBtn} ${segmentType === 'cohort' ? styles.active : ''}`}
                            onClick={() => setSegmentType('cohort')}
                        >
                            <Users size={16} />
                            By Cohort
                        </button>
                        <button
                            className={`${styles.segmentBtn} ${segmentType === 'phase' ? styles.active : ''}`}
                            onClick={() => setSegmentType('phase')}
                        >
                            <Users size={16} />
                            By Phase
                        </button>
                    </div>

                    {/* Recipients / Segment */}
                    <div className={styles.field}>
                        <label>To:</label>
                        {segmentType === 'individual' ? (
                            <>
                                <div className={styles.recipientBox}>
                                    {recipients.map(r => (
                                        <span key={r.email} className={styles.recipientChip}>
                                            <User size={12} />
                                            {r.name}
                                            <button onClick={() => removeRecipient(r.email)}>
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    <div className={styles.recipientSearch}>
                                        <input
                                            type="text"
                                            placeholder="Search recipients..."
                                            value={recipientSearch}
                                            onChange={(e) => setRecipientSearch(e.target.value)}
                                        />
                                        {searching && <Loader2 size={14} className={styles.spinner} />}
                                    </div>
                                </div>
                                {searchResults.length > 0 && (
                                    <div className={styles.searchDropdown}>
                                        {searchResults.map(r => (
                                            <button key={r.id} onClick={() => addRecipient(r)} className={styles.searchResult}>
                                                <User size={14} />
                                                <span className={styles.resultName}>{r.name}</span>
                                                <span className={styles.resultEmail}>{r.email}</span>
                                                <span className={styles.resultType}>{r.type}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : segmentType === 'cohort' ? (
                            <div className={styles.segmentPicker}>
                                <Select
                                    value={selectedCohort}
                                    onChange={setSelectedCohort}
                                    options={[
                                        { value: '', label: 'Select Cohort...' },
                                        ...cohorts.map(c => ({ value: c.id, label: c.name }))
                                    ]}
                                />
                                {segmentCount !== null && (
                                    <span className={styles.segmentCountBadge}>
                                        {segmentCount} participant{segmentCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        ) : segmentType === 'phase' ? (
                            <div className={styles.segmentPicker}>
                                <Select
                                    value={selectedPhase}
                                    onChange={setSelectedPhase}
                                    options={[
                                        { value: '', label: 'Select Phase...' },
                                        ...PHASES
                                    ]}
                                />
                                {segmentCount !== null && (
                                    <span className={styles.segmentCountBadge}>
                                        {segmentCount} participant{segmentCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className={styles.segmentPicker}>
                                <span className={styles.allParticipantsBadge}>
                                    <UsersRound size={16} />
                                    All active participants
                                    {segmentCount !== null && (
                                        <span className={styles.segmentCountBadge}>
                                            {segmentCount}
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Subject */}
                    <div className={styles.field}>
                        <label>Subject:</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject..."
                            className={styles.subjectInput}
                        />
                    </div>

                    {/* Toolbar */}
                    <div className={styles.toolbar}>
                        <div className={styles.toolbarGroup}>
                            <button title="Bold"><Bold size={16} /></button>
                            <button title="Italic"><Italic size={16} /></button>
                            <button title="Link"><LinkIcon size={16} /></button>
                            <button title="List"><List size={16} /></button>
                            <button title="Paragraph"><AlignLeft size={16} /></button>
                        </div>
                        <div className={styles.toolbarGroup}>
                            <Select
                                value=""
                                onChange={(v) => { if (v) insertVariable(v); }}
                                options={[
                                    { value: '', label: 'Insert Variable...' },
                                    { value: 'firstName', label: '{{firstName}}' },
                                    { value: 'lastName', label: '{{lastName}}' },
                                    { value: 'email', label: '{{email}}' },
                                    { value: 'cohortName', label: '{{cohortName}}' },
                                ]}
                            />
                        </div>
                        <button
                            className={`${styles.previewBtn} ${previewMode ? styles.active : ''}`}
                            onClick={() => setPreviewMode(!previewMode)}
                        >
                            <Eye size={16} />
                            {previewMode ? 'Edit' : 'Preview'}
                        </button>
                    </div>

                    {/* Content Area */}
                    {previewMode ? (
                        <div className={styles.previewArea}>
                            <div className={styles.previewLabel}>Preview</div>
                            <div
                                className={styles.previewContent}
                                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                            />
                        </div>
                    ) : (
                        <textarea
                            id="email-content"
                            className={styles.contentArea}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your email content here...

You can use {{variable}} placeholders that will be replaced with recipient data.

Available variables:
- {{firstName}} - Recipient's first name
- {{lastName}} - Recipient's last name
- {{email}} - Recipient's email address"
                        />
                    )}

                    {/* Actions */}
                    <div className={styles.actions}>
                        <Link href="/admin/communications" className={styles.cancelBtn}>
                            Cancel
                        </Link>
                        <button className={styles.saveBtn} disabled>
                            <Save size={16} />
                            Save as Template
                        </button>
                        <button
                            className={`${styles.sendBtn} ${sendSuccess ? styles.success : ''}`}
                            onClick={handleSend}
                            disabled={sending || getRecipientCount() === 0}
                        >
                            {sending ? (
                                <Loader2 size={16} className={styles.spinner} />
                            ) : sendSuccess ? (
                                <CheckCircle size={16} />
                            ) : (
                                <Send size={16} />
                            )}
                            {sendSuccess ? 'Queued!' : `Send to ${getRecipientCount()}`}
                        </button>
                    </div>
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarSection}>
                        <h3>Templates</h3>
                        {templates.length === 0 ? (
                            <p className={styles.noTemplates}>No templates created yet</p>
                        ) : (
                            <div className={styles.templateList}>
                                {templates.map(t => (
                                    <button
                                        key={t.id}
                                        className={`${styles.templateItem} ${selectedTemplate === t.slug ? styles.selected : ''}`}
                                        onClick={() => handleTemplateSelect(t.slug)}
                                    >
                                        <span className={styles.templateName}>{t.name}</span>
                                        <span className={styles.templateCategory}>{t.category}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={styles.sidebarSection}>
                        <h3>Recipients Summary</h3>
                        <div className={styles.recipientsSummary}>
                            <Users size={16} />
                            <span>{getRecipientCount()} recipient(s) selected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
