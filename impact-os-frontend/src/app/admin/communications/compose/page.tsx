'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Send, User, Users, Loader2, Eye, Save, X, UsersRound, CheckCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { Select, RichTextEditor, Modal } from '@/components/ui';
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

const CATEGORIES = [
    { value: 'INTAKE', label: 'Application/Intake' },
    { value: 'ADMISSION', label: 'Admission' },
    { value: 'PARTICIPANT', label: 'Participant Communications' },
    { value: 'MISSION', label: 'Mission Related' },
    { value: 'AUTH', label: 'Authentication' },
    { value: 'STAFF', label: 'Staff' },
    { value: 'OTHER', label: 'Other' },
];

// Standard variables available in compose
const COMPOSE_VARIABLES = [
    { name: 'firstName', description: 'Participant first name', required: true },
    { name: 'lastName', description: 'Participant last name', required: true },
    { name: 'email', description: 'Participant email address', required: true },
    { name: 'cohortName', description: 'Current cohort name', required: false },
    { name: 'phase', description: 'Current program phase', required: false },
    { name: 'dashboardLink', description: 'Link to participant dashboard', required: false },
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

    // Save as Template Modal
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateSlug, setTemplateSlug] = useState('');
    const [templateCategory, setTemplateCategory] = useState('OTHER');
    const [templateDescription, setTemplateDescription] = useState('');
    const [savingTemplate, setSavingTemplate] = useState(false);

    // UI State
    const [sending, setSending] = useState(false);
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

    // Extract variables from content
    const extractVariables = (html: string) => {
        const matches = html.match(/\{\{(\w+)\}\}/g) || [];
        const uniqueVars = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
        return uniqueVars.map(name => ({
            name,
            description: COMPOSE_VARIABLES.find(v => v.name === name)?.description || `Variable: ${name}`,
            required: true,
        }));
    };

    // Save as template
    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !templateSlug.trim()) {
            alert('Please enter a name and slug for the template');
            return;
        }

        setSavingTemplate(true);
        try {
            const variables = extractVariables(content);
            const res = await fetch(`${API_BASE}/api/email-templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: templateName,
                    slug: templateSlug,
                    description: templateDescription,
                    category: templateCategory,
                    subject,
                    htmlContent: content,
                    variables,
                }),
            });

            if (res.ok) {
                setShowSaveModal(false);
                setTemplateName('');
                setTemplateSlug('');
                setTemplateDescription('');
                // Refresh templates
                const updated = await fetch(`${API_BASE}/api/admin/communications/templates`).then(r => r.json());
                setTemplates(Array.isArray(updated) ? updated : []);
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to save template');
            }
        } catch (error) {
            console.error('Save template error:', error);
            alert('Failed to save template');
        } finally {
            setSavingTemplate(false);
        }
    };

    // Auto-generate slug from name
    const handleTemplateNameChange = (name: string) => {
        setTemplateName(name);
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
        setTemplateSlug(slug);
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

                    {/* Rich Text Editor */}
                    <div className={styles.editorWrapper}>
                        <RichTextEditor
                            value={content}
                            onChange={setContent}
                            variables={COMPOSE_VARIABLES}
                            placeholder="Write your email content here..."
                            minHeight={400}
                        />
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <Link href="/admin/communications" className={styles.cancelBtn}>
                            Cancel
                        </Link>
                        <button
                            className={styles.saveBtn}
                            onClick={() => setShowSaveModal(true)}
                            disabled={!content.trim() || !subject.trim()}
                        >
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

            {/* Save as Template Modal */}
            <Modal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                title="Save as Template"
            >
                <div className={styles.saveModalContent}>
                    <div className={styles.modalField}>
                        <label>Template Name *</label>
                        <input
                            type="text"
                            value={templateName}
                            onChange={(e) => handleTemplateNameChange(e.target.value)}
                            placeholder="e.g., Welcome Email"
                        />
                    </div>
                    <div className={styles.modalField}>
                        <label>Slug *</label>
                        <input
                            type="text"
                            value={templateSlug}
                            onChange={(e) => setTemplateSlug(e.target.value)}
                            placeholder="e.g., welcome_email"
                        />
                        <span className={styles.hint}>Used to reference this template in code</span>
                    </div>
                    <div className={styles.modalField}>
                        <label>Category</label>
                        <Select
                            value={templateCategory}
                            onChange={setTemplateCategory}
                            options={CATEGORIES}
                        />
                    </div>
                    <div className={styles.modalField}>
                        <label>Description</label>
                        <textarea
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            placeholder="Brief description of when this template is used..."
                            rows={2}
                        />
                    </div>

                    {/* Show detected variables */}
                    {content && extractVariables(content).length > 0 && (
                        <div className={styles.detectedVars}>
                            <label>Detected Variables:</label>
                            <div className={styles.varsList}>
                                {extractVariables(content).map(v => (
                                    <span key={v.name} className={styles.varChip}>
                                        {`{{${v.name}}}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button
                            className={styles.cancelBtn}
                            onClick={() => setShowSaveModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className={styles.saveBtn}
                            onClick={handleSaveTemplate}
                            disabled={savingTemplate || !templateName.trim() || !templateSlug.trim()}
                        >
                            {savingTemplate ? (
                                <Loader2 size={16} className={styles.spinner} />
                            ) : (
                                <FileText size={16} />
                            )}
                            Create Template
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
