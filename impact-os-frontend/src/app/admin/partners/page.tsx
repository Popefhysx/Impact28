'use client';

import { useState, useEffect } from 'react';
import { Users, Mail, Phone, Clock, Check, X, Loader2, ExternalLink, Building2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { AdminToolbar } from '@/components/admin/AdminToolbar';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types - unified partner inquiry
interface PartnerInquiry {
    id: string;
    // From SponsorInquiry
    name?: string;
    // From PartnerInquiry
    organizationName?: string;
    contactName?: string;
    email: string;
    phone?: string;
    website?: string;
    organizationType?: string;
    partnershipType?: string;
    interestType?: string;
    amountInterest?: string;
    message?: string;
    description?: string;
    status: 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'DECLINED';
    assignedTo?: string;
    notes?: string;
    followedUpAt?: string;
    createdAt: string;
    type: 'sponsor' | 'partner';
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Check }> = {
    NEW: { label: 'New', color: 'var(--gold-warm)', icon: Clock },
    CONTACTED: { label: 'Contacted', color: 'var(--accent-info)', icon: Mail },
    IN_PROGRESS: { label: 'In Progress', color: 'var(--accent-warning)', icon: Clock },
    CONVERTED: { label: 'Converted', color: 'var(--accent-success)', icon: Check },
    DECLINED: { label: 'Declined', color: 'var(--accent-danger)', icon: X },
};

const INTEREST_TYPES: Record<string, string> = {
    ONE_MONTH: 'One Month Sponsor',
    FULL_PROGRAM: 'Full Program Sponsor',
    CUSTOM: 'Custom Sponsorship',
    CORPORATE: 'Corporate Sponsorship',
    TRAINING_PARTNER: 'Training Partner',
    EMPLOYMENT_PARTNER: 'Employment Partner',
    VENUE_PARTNER: 'Venue Partner',
    CONTENT_PARTNER: 'Content Partner',
    MEDIA_PARTNER: 'Media Partner',
    CHURCH_PARTNER: 'Church Partner',
    SCHOOL_PARTNER: 'School Partner',
    OTHER: 'Other',
};

// Mock data for development
const mockPartners: PartnerInquiry[] = [
    {
        id: 'p-001',
        organizationName: 'TechNigeria Foundation',
        contactName: 'Adaeze Okafor',
        email: 'adaeze@technigeria.org',
        phone: '+234 812 345 6789',
        website: 'www.technigeria.org',
        partnershipType: 'TRAINING_PARTNER',
        description: 'We would like to partner with Project 3:10 to provide tech training resources and mentorship opportunities for participants.',
        status: 'NEW',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'partner',
    },
    {
        id: 's-001',
        name: 'GTBank PLC',
        email: 'csr@gtbank.com',
        phone: '+234 1 234 5678',
        organizationType: 'Corporate',
        interestType: 'FULL_PROGRAM',
        amountInterest: '5000000',
        message: 'We are interested in sponsoring the full program for 10 participants as part of our CSR initiative.',
        status: 'CONTACTED',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'sponsor',
    },
    {
        id: 'p-002',
        organizationName: 'Living Faith Church',
        contactName: 'Pastor Emmanuel',
        email: 'outreach@lfchurch.org',
        phone: '+234 803 456 7890',
        partnershipType: 'CHURCH_PARTNER',
        description: 'Our church would like to refer young people from our community and potentially provide venue space.',
        status: 'IN_PROGRESS',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'partner',
    },
    {
        id: 's-002',
        name: 'Chisom Enterprises',
        email: 'chisom@example.com',
        phone: '+234 706 123 4567',
        organizationType: 'Individual',
        interestType: 'ONE_MONTH',
        amountInterest: '150000',
        message: 'I want to sponsor one month for a participant in honor of my late mother.',
        status: 'CONVERTED',
        followedUpAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'sponsor',
    },
    {
        id: 'p-003',
        organizationName: 'Lagos Business School',
        contactName: 'Dr. Funmi Adeyemi',
        email: 'fadeyemi@lbs.edu',
        website: 'www.lbs.edu.ng',
        partnershipType: 'EMPLOYMENT_PARTNER',
        description: 'We are looking to recruit graduates from Project 3:10 for entry-level positions.',
        status: 'NEW',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'partner',
    },
];

export default function AdminPartnersPage() {
    const [partners, setPartners] = useState<PartnerInquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'IN_PROGRESS' | 'CONVERTED' | 'DECLINED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItem, setSelectedItem] = useState<PartnerInquiry | null>(null);
    const [processing, setProcessing] = useState(false);
    const [notesInput, setNotesInput] = useState('');

    // Fetch data and merge sponsors + partners
    useEffect(() => {
        async function fetchInquiries() {
            try {
                const res = await fetch(`${API_BASE}/partners/admin/all`);
                if (res.ok) {
                    const data = await res.json();
                    // Merge sponsors and partners into unified list
                    const sponsorList = (data.sponsors || []).map((s: PartnerInquiry) => ({ ...s, type: 'sponsor' as const }));
                    const partnerList = (data.partners || []).map((p: PartnerInquiry) => ({ ...p, type: 'partner' as const }));
                    const merged = [...sponsorList, ...partnerList].sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                    // Use mock data if empty (dev mode)
                    setPartners(merged.length > 0 ? merged : mockPartners);
                } else if (process.env.NODE_ENV !== 'production') {
                    setPartners(mockPartners);
                }
            } catch (error) {
                console.error('Failed to fetch inquiries:', error);
                if (process.env.NODE_ENV !== 'production') {
                    setPartners(mockPartners);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchInquiries();
    }, []);

    const filteredPartners = partners.filter(p => {
        if (filter !== 'ALL' && p.status !== filter) return false;
        const displayName = p.organizationName || p.name || '';
        const contact = p.contactName || '';
        if (searchQuery && !displayName.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !contact.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !p.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleStatusUpdate = async (id: string, type: 'sponsor' | 'partner', status: string) => {
        setProcessing(true);
        try {
            const res = await fetch(`${API_BASE}/partners/admin/${type}/${id}/status?status=${status}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: notesInput }),
            });

            if (res.ok) {
                const updated = await res.json();
                setPartners(prev => prev.map(p => p.id === id ? { ...updated, type } : p));
                setSelectedItem(null);
                setNotesInput('');
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getDisplayName = (p: PartnerInquiry) => p.organizationName || p.name || 'Unknown';
    const getInterestType = (p: PartnerInquiry) => p.partnershipType || p.interestType || '';
    const getMessage = (p: PartnerInquiry) => p.description || p.message || '';

    const newCount = partners.filter(p => p.status === 'NEW').length;

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <Loader2 className={styles.spinner} />
                <p>Loading inquiries...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>Partners</h1>
                    <p className={styles.subtitle}>
                        Manage partnership inquiries from the marketing website
                    </p>
                </div>
                {newCount > 0 && (
                    <span className={styles.newBadge}>{newCount} new</span>
                )}
            </div>

            {/* Toolbar */}
            <AdminToolbar
                searchValue={searchQuery}
                searchPlaceholder="Search by name or email..."
                onSearchChange={setSearchQuery}
            >
                <Select
                    value={filter}
                    onChange={(value) => setFilter(value as typeof filter)}
                    options={[
                        { value: 'ALL', label: 'All Status' },
                        { value: 'NEW', label: 'New' },
                        { value: 'CONTACTED', label: 'Contacted' },
                        { value: 'IN_PROGRESS', label: 'In Progress' },
                        { value: 'CONVERTED', label: 'Converted' },
                        { value: 'DECLINED', label: 'Declined' },
                    ]}
                />
            </AdminToolbar>

            {/* Content */}
            <div className={styles.content}>
                {filteredPartners.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Users size={48} />
                        <h3>No partner inquiries</h3>
                        <p>New inquiries will appear here</p>
                    </div>
                ) : (
                    <div className={styles.cardGrid}>
                        {filteredPartners.map(partner => (
                            <div key={partner.id} className={styles.card} onClick={() => setSelectedItem(partner)}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardTitle}>
                                        <h3>{getDisplayName(partner)}</h3>
                                        {partner.contactName && (
                                            <span className={styles.contact}>Contact: {partner.contactName}</span>
                                        )}
                                        {partner.organizationType && (
                                            <span className={styles.orgType}>{partner.organizationType}</span>
                                        )}
                                    </div>
                                    <span
                                        className={styles.statusBadge}
                                        style={{ background: STATUS_CONFIG[partner.status]?.color || 'var(--text-tertiary)' }}
                                    >
                                        {STATUS_CONFIG[partner.status]?.label || partner.status}
                                    </span>
                                </div>
                                <div className={styles.cardMeta}>
                                    <span><Mail size={14} /> {partner.email}</span>
                                    {partner.phone && <span><Phone size={14} /> {partner.phone}</span>}
                                    {partner.website && (
                                        <span><ExternalLink size={14} /> {partner.website}</span>
                                    )}
                                </div>
                                <div className={styles.cardType}>
                                    <strong>{INTEREST_TYPES[getInterestType(partner)] || getInterestType(partner)}</strong>
                                    {partner.amountInterest && (
                                        <span className={styles.amount}>₦{Number(partner.amountInterest).toLocaleString()}</span>
                                    )}
                                </div>
                                {getMessage(partner) && (
                                    <p className={styles.cardMessage}>
                                        {getMessage(partner)}
                                    </p>
                                )}
                                <div className={styles.cardFooter}>
                                    <span className={styles.typeBadge}>
                                        {partner.type === 'sponsor' ? <Building2 size={12} /> : <Users size={12} />}
                                        {partner.type === 'sponsor' ? 'Sponsor' : 'Partner'}
                                    </span>
                                    <span className={styles.date}>{formatDate(partner.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{getDisplayName(selectedItem)}</h2>
                            <button className={styles.closeButton} onClick={() => setSelectedItem(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalContent}>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem}>
                                    <label>Email</label>
                                    <a href={`mailto:${selectedItem.email}`}>{selectedItem.email}</a>
                                </div>
                                {selectedItem.phone && (
                                    <div className={styles.detailItem}>
                                        <label>Phone</label>
                                        <a href={`tel:${selectedItem.phone}`}>{selectedItem.phone}</a>
                                    </div>
                                )}
                                {selectedItem.contactName && (
                                    <div className={styles.detailItem}>
                                        <label>Contact Person</label>
                                        <span>{selectedItem.contactName}</span>
                                    </div>
                                )}
                                <div className={styles.detailItem}>
                                    <label>Interest Type</label>
                                    <span>{INTEREST_TYPES[getInterestType(selectedItem)] || getInterestType(selectedItem)}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <label>Submitted</label>
                                    <span>{formatDate(selectedItem.createdAt)}</span>
                                </div>
                            </div>

                            {getMessage(selectedItem) && (
                                <div className={styles.messageSection}>
                                    <label>Message / Description</label>
                                    <p>{getMessage(selectedItem)}</p>
                                </div>
                            )}

                            {selectedItem.notes && (
                                <div className={styles.messageSection}>
                                    <label>Notes</label>
                                    <p>{selectedItem.notes}</p>
                                </div>
                            )}

                            <div className={styles.notesInput}>
                                <label>Add/Update Notes</label>
                                <textarea
                                    value={notesInput}
                                    onChange={(e) => setNotesInput(e.target.value)}
                                    placeholder="Add notes about this inquiry..."
                                    rows={3}
                                />
                            </div>

                            <div className={styles.statusActions}>
                                <label>Update Status</label>
                                <div className={styles.actionButtons}>
                                    {['NEW', 'CONTACTED', 'IN_PROGRESS', 'CONVERTED', 'DECLINED'].map(status => (
                                        <button
                                            key={status}
                                            className={`${styles.statusButton} ${selectedItem.status === status ? styles.activeStatus : ''}`}
                                            style={{
                                                '--status-color': STATUS_CONFIG[status]?.color,
                                            } as React.CSSProperties}
                                            disabled={processing || selectedItem.status === status}
                                            onClick={() => handleStatusUpdate(
                                                selectedItem.id,
                                                selectedItem.type,
                                                status
                                            )}
                                        >
                                            {processing ? <Loader2 size={14} className={styles.spinner} /> : null}
                                            {STATUS_CONFIG[status]?.label || status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
