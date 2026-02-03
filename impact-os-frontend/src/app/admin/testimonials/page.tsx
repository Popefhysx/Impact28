'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Check, X, Clock, Star, Loader2, MessageSquareQuote, LayoutGrid, LayoutList, MapPin, Briefcase, Eye, PenSquare } from 'lucide-react';
import Image from 'next/image';
import { Select } from '@/components/ui/Select';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Types
interface Testimonial {
    id: string;
    name: string;
    role: string;
    company?: string;
    location: string;
    quote: string;
    skills: string[];
    imageUrl?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    isFeatured: boolean;
    displayOrder?: number;
    submittedAt: string;
    approvedAt?: string;
    approvedBy?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Check }> = {
    PENDING: { label: 'Pending Review', color: 'var(--gold-warm)', icon: Clock },
    APPROVED: { label: 'Approved', color: 'var(--accent-success)', icon: Check },
    REJECTED: { label: 'Rejected', color: 'var(--accent-danger)', icon: X },
};

// Mock data for development
const mockTestimonials: Testimonial[] = [
    {
        id: 'test-001',
        name: 'Adaeze Okonkwo',
        role: 'Freelance Developer',
        company: 'Self-Employed',
        location: 'Lagos, Nigeria',
        quote: 'Impact OS completely transformed my approach to freelancing. Within 3 months of joining, I landed my first paying client and have not looked back since. The structured missions and accountability system kept me on track when I wanted to give up.',
        skills: ['Web Development', 'React', 'Node.js'],
        status: 'APPROVED',
        isFeatured: true,
        submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'admin',
    },
    {
        id: 'test-002',
        name: 'Chidi Eze',
        role: 'Graphic Designer',
        location: 'Abuja, Nigeria',
        quote: 'I was skeptical at first, but the program really works. The community support is amazing and I have made lifelong friends. Now I earn consistently from design work.',
        skills: ['Graphic Design', 'Canva', 'Adobe Illustrator'],
        status: 'PENDING',
        isFeatured: false,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'test-003',
        name: 'Ngozi Ibe',
        role: 'Content Writer',
        company: 'Fiverr Pro',
        location: 'Port Harcourt, Nigeria',
        quote: 'From zero writing experience to Fiverr Pro seller in 6 months. The behavioral approach here is unlike anything I have seen. It actually forces you to take action instead of just consuming content.',
        skills: ['Content Writing', 'SEO', 'Copywriting'],
        status: 'APPROVED',
        isFeatured: false,
        displayOrder: 2,
        submittedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'admin',
    },
    {
        id: 'test-004',
        name: 'Tunde Adeyemi',
        role: 'Student',
        location: 'Ibadan, Nigeria',
        quote: 'This program helped me balance my studies with learning real skills. I started making money before even graduating.',
        skills: ['Social Media', 'Video Editing'],
        status: 'PENDING',
        isFeatured: false,
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'test-005',
        name: 'Fake Testimonial',
        role: 'Scammer',
        location: 'Unknown',
        quote: 'This is obviously fake and should be rejected.',
        skills: [],
        status: 'REJECTED',
        isFeatured: false,
        submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

export default function AdminTestimonialsPage() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
    const [actionModal, setActionModal] = useState<'view' | 'approve' | 'reject' | 'edit' | null>(null);
    const [processing, setProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [editForm, setEditForm] = useState<Partial<Testimonial>>({});
    const [skillsInput, setSkillsInput] = useState('');

    // Fetch testimonials from API
    useEffect(() => {
        async function fetchTestimonials() {
            try {
                const res = await fetch(`${API_BASE}/testimonials/admin/all`);
                if (res.ok) {
                    const data = await res.json();
                    setTestimonials(data.length > 0 ? data : (process.env.NODE_ENV !== 'production' ? mockTestimonials : []));
                } else if (process.env.NODE_ENV !== 'production') {
                    setTestimonials(mockTestimonials);
                }
            } catch (error) {
                console.error('Failed to fetch testimonials:', error);
                if (process.env.NODE_ENV !== 'production') {
                    setTestimonials(mockTestimonials);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchTestimonials();
    }, []);

    const filteredTestimonials = testimonials.filter(t => {
        if (filter !== 'ALL' && t.status !== filter) return false;
        if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !t.quote.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const pendingCount = testimonials.filter(t => t.status === 'PENDING').length;
    const approvedCount = testimonials.filter(t => t.status === 'APPROVED').length;

    const handleApprove = async () => {
        if (!selectedTestimonial) return;
        setProcessing(true);

        try {
            const res = await fetch(`${API_BASE}/testimonials/admin/${selectedTestimonial.id}/approve`, {
                method: 'PUT',
            });

            if (res.ok) {
                setTestimonials(prev => prev.map(t =>
                    t.id === selectedTestimonial.id
                        ? { ...t, status: 'APPROVED', approvedAt: new Date().toISOString() }
                        : t
                ));
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setProcessing(false);
            setActionModal(null);
            setSelectedTestimonial(null);
        }
    };

    const handleReject = async () => {
        if (!selectedTestimonial) return;
        setProcessing(true);

        try {
            const res = await fetch(`${API_BASE}/testimonials/admin/${selectedTestimonial.id}/reject`, {
                method: 'PUT',
            });

            if (res.ok) {
                setTestimonials(prev => prev.map(t =>
                    t.id === selectedTestimonial.id
                        ? { ...t, status: 'REJECTED' }
                        : t
                ));
            }
        } catch (error) {
            console.error('Failed to reject:', error);
        } finally {
            setProcessing(false);
            setActionModal(null);
            setSelectedTestimonial(null);
        }
    };

    const handleToggleFeatured = async (testimonial: Testimonial) => {
        try {
            const res = await fetch(`${API_BASE}/testimonials/admin/${testimonial.id}/display`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isFeatured: !testimonial.isFeatured }),
            });

            if (res.ok) {
                setTestimonials(prev => prev.map(t =>
                    t.id === testimonial.id
                        ? { ...t, isFeatured: !t.isFeatured }
                        : t
                ));
            }
        } catch (error) {
            console.error('Failed to toggle featured:', error);
        }
    };

    const handleEdit = (testimonial: Testimonial) => {
        setSelectedTestimonial(testimonial);
        setEditForm({
            name: testimonial.name,
            role: testimonial.role,
            company: testimonial.company || '',
            location: testimonial.location,
            quote: testimonial.quote,
            skills: testimonial.skills,
        });
        setSkillsInput(testimonial.skills.join(', '));
        setActionModal('edit');
    };

    const handleSaveEdit = async () => {
        if (!selectedTestimonial) return;

        // Validation: Ensure at least one of Company or Location is provided
        if (!editForm.company?.trim() && !editForm.location?.trim()) {
            alert('Please provide either a Company or a Location.');
            return;
        }

        setProcessing(true);

        const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const payload = { ...editForm, skills: skillsArray };

        try {
            const res = await fetch(`${API_BASE}/testimonials/admin/${selectedTestimonial.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const updated = await res.json();
                setTestimonials(prev => prev.map(t =>
                    t.id === selectedTestimonial.id ? { ...t, ...updated } : t
                ));
            } else {
                // In dev mode, update locally
                if (process.env.NODE_ENV !== 'production') {
                    setTestimonials(prev => prev.map(t =>
                        t.id === selectedTestimonial.id ? { ...t, ...editForm } : t
                    ));
                }
            }
        } catch (error) {
            console.error('Failed to save edit:', error);
            // In dev mode, update locally anyway
            if (process.env.NODE_ENV !== 'production') {
                setTestimonials(prev => prev.map(t =>
                    t.id === selectedTestimonial.id ? { ...t, ...editForm } : t
                ));
            }
        } finally {
            setProcessing(false);
            setActionModal(null);
            setSelectedTestimonial(null);
            setEditForm({});
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const truncateQuote = (quote: string, maxLength = 120) => {
        if (quote.length <= maxLength) return quote;
        return quote.substring(0, maxLength).trim() + '...';
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1><MessageSquareQuote size={24} /> Testimonials</h1>
                    <p className={styles.subtitle}>
                        {pendingCount > 0 ? (
                            <><strong>{pendingCount}</strong> pending review • <strong>{approvedCount}</strong> approved</>
                        ) : (
                            <><strong>{approvedCount}</strong> testimonials live on website</>
                        )}
                    </p>
                </div>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or content..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <Filter size={16} />
                    <Select
                        value={filter}
                        onChange={(val) => setFilter(val as typeof filter)}
                        options={[
                            { value: 'ALL', label: 'All Status' },
                            { value: 'PENDING', label: `Pending (${pendingCount})` },
                            { value: 'APPROVED', label: 'Approved' },
                            { value: 'REJECTED', label: 'Rejected' },
                        ]}
                    />
                </div>

                {/* View Toggle */}
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <LayoutList size={18} />
                    </button>
                </div>
            </div>

            {/* Testimonial List */}
            {loading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={24} className={styles.spinner} />
                    <p>Loading testimonials...</p>
                </div>
            ) : filteredTestimonials.length === 0 ? (
                <div className={styles.emptyState}>
                    <MessageSquareQuote size={48} />
                    <h3>No testimonials found</h3>
                    <p>Testimonials submitted via the website will appear here for review.</p>
                </div>
            ) : (
                <div className={`${styles.testimonialList} ${viewMode === 'grid' ? styles.gridView : styles.listView}`}>
                    {filteredTestimonials.map((testimonial) => {
                        const statusInfo = STATUS_CONFIG[testimonial.status];
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={testimonial.id}
                                className={`${styles.testimonialCard} ${testimonial.status === 'PENDING' ? styles.pending : ''}`}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.personInfo}>
                                        {testimonial.imageUrl ? (
                                            <Image src={testimonial.imageUrl} alt={testimonial.name} className={styles.avatar} width={40} height={40} />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                        )}
                                        <div>
                                            <span className={styles.personName}>{testimonial.name}</span>
                                            <div className={styles.personMeta}>
                                                <span><Briefcase size={12} /> {testimonial.role}</span>
                                                {testimonial.company && <span>@ {testimonial.company}</span>}
                                            </div>
                                            <span className={styles.location}>
                                                <MapPin size={12} /> {testimonial.location}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.dateTag}>{formatDate(testimonial.submittedAt)}</span>
                                        {testimonial.isFeatured && (
                                            <span className={styles.featuredBadge}>
                                                <Star size={12} /> Featured
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.quoteSection}>
                                    <blockquote className={styles.quote}>
                                        &quot;{truncateQuote(testimonial.quote)}&quot;
                                    </blockquote>
                                    {testimonial.skills.length > 0 && (
                                        <div className={styles.skillTags}>
                                            {testimonial.skills.slice(0, 3).map((skill, idx) => (
                                                <span key={idx} className={styles.skillTag}>{skill}</span>
                                            ))}
                                            {testimonial.skills.length > 3 && (
                                                <span className={styles.moreSkills}>+{testimonial.skills.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.cardFooter}>
                                    <span className={styles.statusBadge} style={{ color: statusInfo.color }}>
                                        <StatusIcon size={14} />
                                        {statusInfo.label}
                                    </span>

                                    <div className={styles.actions}>
                                        <button
                                            className={`${styles.actionBtn} ${styles.viewBtn2}`}
                                            onClick={() => {
                                                setSelectedTestimonial(testimonial);
                                                setActionModal('view');
                                            }}
                                        >
                                            <Eye size={16} /> View
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.editBtn}`}
                                            onClick={() => handleEdit(testimonial)}
                                        >
                                            <PenSquare size={16} /> Edit
                                        </button>
                                        {testimonial.status === 'PENDING' && (
                                            <>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                    onClick={() => {
                                                        setSelectedTestimonial(testimonial);
                                                        setActionModal('approve');
                                                    }}
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                    onClick={() => {
                                                        setSelectedTestimonial(testimonial);
                                                        setActionModal('reject');
                                                    }}
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                            </>
                                        )}
                                        {testimonial.status === 'APPROVED' && (
                                            <button
                                                className={`${styles.actionBtn} ${testimonial.isFeatured ? styles.unfeaturedBtn : styles.featuredBtn}`}
                                                onClick={() => handleToggleFeatured(testimonial)}
                                            >
                                                <Star size={16} /> {testimonial.isFeatured ? 'Unfeature' : 'Feature'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* View Modal */}
            {actionModal === 'view' && selectedTestimonial && (
                <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Testimonial Detail</h2>
                            <button className={styles.closeBtn} onClick={() => setActionModal(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalContent}>
                            <div className={styles.personDetail}>
                                {selectedTestimonial.imageUrl ? (
                                    <Image src={selectedTestimonial.imageUrl} alt={selectedTestimonial.name} className={styles.modalAvatar} width={80} height={80} />
                                ) : (
                                    <div className={styles.modalAvatarPlaceholder}>
                                        {selectedTestimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                )}
                                <div>
                                    <h3>{selectedTestimonial.name}</h3>
                                    <p>{selectedTestimonial.role} {selectedTestimonial.company && `@ ${selectedTestimonial.company}`}</p>
                                    <p className={styles.locationText}><MapPin size={14} /> {selectedTestimonial.location}</p>
                                </div>
                            </div>

                            <div className={styles.quoteBlock}>
                                <blockquote>&quot;{selectedTestimonial.quote}&quot;</blockquote>
                            </div>

                            {selectedTestimonial.skills.length > 0 && (
                                <div className={styles.skillsSection}>
                                    <strong>Skills Mentioned:</strong>
                                    <div className={styles.skillTags}>
                                        {selectedTestimonial.skills.map((skill, idx) => (
                                            <span key={idx} className={styles.skillTag}>{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className={styles.metaSection}>
                                <p><strong>Submitted:</strong> {formatDate(selectedTestimonial.submittedAt)}</p>
                                {selectedTestimonial.approvedAt && (
                                    <p><strong>Approved:</strong> {formatDate(selectedTestimonial.approvedAt)} by {selectedTestimonial.approvedBy}</p>
                                )}
                            </div>
                        </div>

                        {selectedTestimonial.status === 'PENDING' && (
                            <div className={styles.modalActions}>
                                <button
                                    className={styles.confirmApproveBtn}
                                    onClick={() => {
                                        setActionModal('approve');
                                    }}
                                >
                                    <Check size={16} /> Approve
                                </button>
                                <button
                                    className={styles.confirmRejectBtn}
                                    onClick={() => {
                                        setActionModal('reject');
                                    }}
                                >
                                    <X size={16} /> Reject
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Approve Confirmation Modal */}
            {actionModal === 'approve' && selectedTestimonial && (
                <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Approve Testimonial?</h2>
                        <p className={styles.modalSubtitle}>
                            This testimonial from <strong>{selectedTestimonial.name}</strong> will be visible on the website.
                        </p>

                        <div className={styles.previewQuote}>
                            &quot;{truncateQuote(selectedTestimonial.quote, 200)}&quot;
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setActionModal(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.confirmApproveBtn}
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                {processing ? <Loader2 size={16} className={styles.spinner} /> : <Check size={16} />}
                                Yes, Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Confirmation Modal */}
            {actionModal === 'reject' && selectedTestimonial && (
                <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Reject Testimonial?</h2>
                        <p className={styles.modalSubtitle}>
                            This testimonial from <strong>{selectedTestimonial.name}</strong> will not be published.
                        </p>

                        <div className={styles.previewQuote}>
                            &quot;{truncateQuote(selectedTestimonial.quote, 200)}&quot;
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setActionModal(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.confirmRejectBtn}
                                onClick={handleReject}
                                disabled={processing}
                            >
                                {processing ? <Loader2 size={16} className={styles.spinner} /> : <X size={16} />}
                                Yes, Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {actionModal === 'edit' && selectedTestimonial && (
                <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Testimonial</h2>
                            <button className={styles.closeBtn} onClick={() => setActionModal(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={editForm.name || ''}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Role / Title</label>
                                    <input
                                        type="text"
                                        value={editForm.role || ''}
                                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Company (optional)</label>
                                    <input
                                        type="text"
                                        value={editForm.company || ''}
                                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={editForm.location || ''}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Skills (comma separated)</label>
                                <input
                                    type="text"
                                    value={skillsInput}
                                    onChange={(e) => setSkillsInput(e.target.value)}
                                    placeholder="e.g. React, Design, Marketing"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Your Story</label>
                                <textarea
                                    rows={5}
                                    value={editForm.quote || ''}
                                    onChange={(e) => setEditForm({ ...editForm, quote: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setActionModal(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.confirmApproveBtn}
                                onClick={handleSaveEdit}
                                disabled={processing}
                            >
                                {processing ? <Loader2 size={16} className={styles.spinner} /> : <Check size={16} />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
