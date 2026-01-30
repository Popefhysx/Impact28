'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, UserPlus, Eye, MoreHorizontal, Shield, UserCheck, UserMinus, ChevronDown, Users, X } from 'lucide-react';
import { Select } from '@/components/ui';
import styles from './page.module.css';

// Types
interface StaffMember {
    id: string;
    category: 'ADMIN' | 'STAFF' | 'OBSERVER';
    isSuperAdmin: boolean;
    capabilities: string[];
    cohortIds: string[];
    isActive: boolean;
    invitedAt: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        lastLoginAt: string | null;
    };
}

interface CapabilityTemplate {
    id: string;
    label: string;
    description: string;
    capabilities: string[];
}

interface Cohort {
    id: string;
    name: string;
}

const categoryColors: Record<string, string> = {
    'ADMIN': 'badge-gold',
    'STAFF': 'badge-info',
    'OBSERVER': 'badge-muted',
};

const categoryIcons: Record<string, React.ReactNode> = {
    'ADMIN': <Shield size={14} />,
    'STAFF': <UserCheck size={14} />,
    'OBSERVER': <Eye size={14} />,
};

export default function StaffPage() {
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [templates, setTemplates] = useState<CapabilityTemplate[]>([]);
    const [cohorts, setCohorts] = useState<Cohort[]>([]);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteCategory, setInviteCategory] = useState<'ADMIN' | 'STAFF' | 'OBSERVER'>('STAFF');
    const [inviteTemplate, setInviteTemplate] = useState('');
    const [inviteCohorts, setInviteCohorts] = useState<string[]>([]);
    const [inviteLoading, setInviteLoading] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // Mock data for demonstration
    const mockStaffMembers: StaffMember[] = [
        {
            id: '1',
            category: 'ADMIN',
            isSuperAdmin: true,
            capabilities: ['admin.full', 'staff.invite', 'staff.manage', 'admissions.manage'],
            cohortIds: [],
            isActive: true,
            invitedAt: '2026-01-01T00:00:00Z',
            user: {
                id: 'u1',
                email: 'sarah.johnson@cycle28.org',
                firstName: 'Sarah',
                lastName: 'Johnson',
                avatarUrl: null,
                lastLoginAt: '2026-01-29T10:30:00Z',
            },
        },
        {
            id: '2',
            category: 'STAFF',
            isSuperAdmin: false,
            capabilities: ['participants.view', 'participants.edit', 'income.review', 'income.approve'],
            cohortIds: ['cohort-1'],
            isActive: true,
            invitedAt: '2026-01-10T00:00:00Z',
            user: {
                id: 'u2',
                email: 'david.okafor@cycle28.org',
                firstName: 'David',
                lastName: 'Okafor',
                avatarUrl: null,
                lastLoginAt: '2026-01-28T15:45:00Z',
            },
        },
        {
            id: '3',
            category: 'STAFF',
            isSuperAdmin: false,
            capabilities: ['admissions.manage', 'cohort.manage', 'reports.view'],
            cohortIds: ['cohort-1', 'cohort-2'],
            isActive: true,
            invitedAt: '2026-01-05T00:00:00Z',
            user: {
                id: 'u3',
                email: 'aisha.ibrahim@cycle28.org',
                firstName: 'Aisha',
                lastName: 'Ibrahim',
                avatarUrl: null,
                lastLoginAt: '2026-01-29T08:00:00Z',
            },
        },
        {
            id: '4',
            category: 'OBSERVER',
            isSuperAdmin: false,
            capabilities: ['reports.view', 'audit.view'],
            cohortIds: ['cohort-1'],
            isActive: true,
            invitedAt: '2026-01-15T00:00:00Z',
            user: {
                id: 'u4',
                email: 'partner@fundingorg.org',
                firstName: 'Michael',
                lastName: 'Chen',
                avatarUrl: null,
                lastLoginAt: '2026-01-25T14:20:00Z',
            },
        },
        {
            id: '5',
            category: 'STAFF',
            isSuperAdmin: false,
            capabilities: ['participants.view', 'support.manage', 'stipend.approve'],
            cohortIds: ['cohort-2'],
            isActive: false,
            invitedAt: '2025-12-01T00:00:00Z',
            user: {
                id: 'u5',
                email: 'former.staff@cycle28.org',
                firstName: 'James',
                lastName: 'Adeyemi',
                avatarUrl: null,
                lastLoginAt: null,
            },
        },
    ];

    const mockTemplates: CapabilityTemplate[] = [
        { id: 'mentor', label: 'Mentor', description: 'View participants and communicate directly', capabilities: [] },
        { id: 'ops', label: 'Operations', description: 'Manage admissions and support requests', capabilities: [] },
        { id: 'finance', label: 'Finance', description: 'Manage support budgets and disbursements', capabilities: [] },
        { id: 'volunteer', label: 'Volunteer', description: 'Limited participant interaction', capabilities: [] },
        { id: 'impact', label: 'Impact', description: 'Track outcomes and generate reports', capabilities: [] },
        { id: 'partner', label: 'Partner', description: 'External stakeholder visibility', capabilities: [] },
    ];

    const mockCohorts: Cohort[] = [
        { id: 'cohort-1', name: 'Cohort 28 - Lagos' },
        { id: 'cohort-2', name: 'Cohort 28 - Abuja' },
        { id: 'cohort-3', name: 'Cohort 29 - Lagos (Upcoming)' },
    ];

    // Fetch staff members
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [staffRes, templatesRes, cohortsRes] = await Promise.all([
                    fetch(`${API_BASE}/staff`),
                    fetch(`${API_BASE}/staff/templates`),
                    fetch(`${API_BASE}/staff/cohorts`),
                ]);

                if (staffRes.ok) {
                    const data = await staffRes.json();
                    setStaffMembers(data.staff?.length > 0 ? data.staff : mockStaffMembers);
                } else {
                    setStaffMembers(mockStaffMembers);
                }

                if (templatesRes.ok) {
                    const tData = await templatesRes.json();
                    setTemplates(tData.templates?.length > 0 ? tData.templates : mockTemplates);
                } else {
                    setTemplates(mockTemplates);
                }

                if (cohortsRes.ok) {
                    const cData = await cohortsRes.json();
                    setCohorts(cData?.length > 0 ? cData : mockCohorts);
                } else {
                    setCohorts(mockCohorts);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                // Use mock data on error
                setStaffMembers(mockStaffMembers);
                setTemplates(mockTemplates);
                setCohorts(mockCohorts);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    // Filter staff
    const filteredStaff = staffMembers.filter(staff => {
        const matchesSearch = search === '' ||
            staff.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
            staff.user.lastName.toLowerCase().includes(search.toLowerCase()) ||
            staff.user.email.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = categoryFilter === '' || staff.category === categoryFilter;

        return matchesSearch && matchesCategory;
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    // Handle invite
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setInviteLoading(true);
        try {
            const response = await fetch(`${API_BASE}/staff/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    category: inviteCategory,
                    templateId: inviteTemplate || undefined,
                    cohortIds: inviteCohorts,
                }),
            });

            if (response.ok) {
                // Refresh staff list
                const refreshRes = await fetch(`${API_BASE}/staff`);
                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setStaffMembers(data.staff || []);
                }
                // Reset form
                setInviteEmail('');
                setInviteCategory('STAFF');
                setInviteTemplate('');
                setInviteCohorts([]);
                setShowInviteModal(false);
            }
        } catch (error) {
            console.error('Invite failed:', error);
        } finally {
            setInviteLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Staff Management</h1>
                    <p className={styles.subtitle}>Manage team members and their access levels</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.inviteButton}
                        onClick={() => setShowInviteModal(true)}
                    >
                        <UserPlus size={16} />
                        Invite Staff
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <Shield size={18} />
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{staffMembers.filter(s => s.category === 'ADMIN').length}</span>
                        <span className={styles.statLabel}>Admins</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <UserCheck size={18} />
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{staffMembers.filter(s => s.category === 'STAFF').length}</span>
                        <span className={styles.statLabel}>Staff</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Eye size={18} />
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{staffMembers.filter(s => s.category === 'OBSERVER').length}</span>
                        <span className={styles.statLabel}>Observers</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    className={styles.filterButton}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={16} />
                    Filters
                    <ChevronDown size={14} />
                </button>
            </div>

            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGroup}>
                        <label>Category</label>
                        <Select
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            placeholder="All Categories"
                            options={[
                                { value: '', label: 'All Categories' },
                                { value: 'ADMIN', label: 'Admin' },
                                { value: 'STAFF', label: 'Staff' },
                                { value: 'OBSERVER', label: 'Observer' },
                            ]}
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Staff Member</th>
                            <th>Category</th>
                            <th>Capabilities</th>
                            <th>Cohorts</th>
                            <th>Invited</th>
                            <th>Last Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className={styles.loadingCell}>
                                    Loading staff members...
                                </td>
                            </tr>
                        ) : filteredStaff.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>
                                    {staffMembers.length === 0
                                        ? 'No staff members yet. Invite someone to get started.'
                                        : 'No staff members found matching your filters.'}
                                </td>
                            </tr>
                        ) : (
                            filteredStaff.map((staff) => (
                                <tr key={staff.id}>
                                    <td>
                                        <div className={styles.staffInfo}>
                                            <div className={styles.avatar}>
                                                {staff.user.firstName[0]}{staff.user.lastName[0]}
                                            </div>
                                            <div>
                                                <div className={styles.name}>
                                                    {staff.user.firstName} {staff.user.lastName}
                                                    {staff.isSuperAdmin && (
                                                        <span className={styles.superBadge}>Super</span>
                                                    )}
                                                </div>
                                                <div className={styles.email}>{staff.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${categoryColors[staff.category] || ''}`}>
                                            {categoryIcons[staff.category]}
                                            {staff.category}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.capCount}>
                                            {staff.capabilities.length} capabilities
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.cohortCount}>
                                            {staff.cohortIds.length === 0
                                                ? 'All'
                                                : `${staff.cohortIds.length} assigned`}
                                        </span>
                                    </td>
                                    <td className={styles.dateCell}>
                                        {formatDate(staff.invitedAt)}
                                    </td>
                                    <td className={styles.dateCell}>
                                        {formatDate(staff.user.lastLoginAt)}
                                    </td>
                                    <td>
                                        <Link
                                            href={`/admin/staff/${staff.id}`}
                                            className={styles.viewButton}
                                        >
                                            <Eye size={16} />
                                            Manage
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Grid View */}
            <div className={styles.gridView}>
                {loading ? (
                    <div className={styles.loadingCell}>Loading staff members...</div>
                ) : filteredStaff.length === 0 ? (
                    <div className={styles.emptyCell}>
                        {staffMembers.length === 0
                            ? 'No staff members yet. Invite someone to get started.'
                            : 'No staff members found matching your filters.'}
                    </div>
                ) : (
                    filteredStaff.map((staff) => (
                        <div key={staff.id} className={styles.staffCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.staffInfo}>
                                    <div className={styles.avatar}>
                                        {staff.user.firstName[0]}{staff.user.lastName[0]}
                                    </div>
                                    <div>
                                        <div className={styles.name}>
                                            {staff.user.firstName} {staff.user.lastName}
                                            {staff.isSuperAdmin && (
                                                <span className={styles.superBadge}>Super</span>
                                            )}
                                        </div>
                                        <div className={styles.email}>{staff.user.email}</div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.cardRow}>
                                    <span className={styles.cardLabel}>Category</span>
                                    <span className={`badge ${categoryColors[staff.category] || ''}`}>
                                        {categoryIcons[staff.category]}
                                        {staff.category}
                                    </span>
                                </div>
                                <div className={styles.cardRow}>
                                    <span className={styles.cardLabel}>Capabilities</span>
                                    <span>{staff.capabilities.length}</span>
                                </div>
                                <div className={styles.cardRow}>
                                    <span className={styles.cardLabel}>Last Active</span>
                                    <span>{formatDate(staff.user.lastLoginAt)}</span>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <Link href={`/admin/staff/${staff.id}`} className={styles.viewButton}>
                                    <Eye size={16} /> Manage
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Invite Staff Member</h2>
                            <button className={styles.modalClose} onClick={() => setShowInviteModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite}>
                            <div className={styles.modalBody}>
                                <div className={styles.formGroup}>
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="staff@example.com"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Category</label>
                                    <Select
                                        value={inviteCategory}
                                        onChange={(val) => setInviteCategory(val as 'ADMIN' | 'STAFF' | 'OBSERVER')}
                                        options={[
                                            { value: 'ADMIN', label: 'Admin', description: 'Can change the system' },
                                            { value: 'STAFF', label: 'Staff', description: 'Can execute assigned work' },
                                            { value: 'OBSERVER', label: 'Observer', description: 'Read-only access' },
                                        ]}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Role Template (optional)</label>
                                    <Select
                                        value={inviteTemplate}
                                        onChange={setInviteTemplate}
                                        placeholder="Select a template..."
                                        options={[
                                            { value: '', label: 'None', description: 'No template' },
                                            ...templates.map((t) => ({
                                                value: t.id,
                                                label: t.label,
                                                description: t.description,
                                            })),
                                        ]}
                                    />
                                </div>
                                {cohorts.length > 0 && (
                                    <div className={styles.formGroup}>
                                        <label>Assign to Cohorts (optional)</label>
                                        <div className={styles.cohortList}>
                                            {cohorts.map((c) => (
                                                <label key={c.id} className={styles.cohortCheckbox}>
                                                    <input
                                                        type="checkbox"
                                                        checked={inviteCohorts.includes(c.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setInviteCohorts([...inviteCohorts, c.id]);
                                                            } else {
                                                                setInviteCohorts(inviteCohorts.filter(id => id !== c.id));
                                                            }
                                                        }}
                                                    />
                                                    {c.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={() => setShowInviteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={inviteLoading || !inviteEmail}
                                >
                                    {inviteLoading ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
