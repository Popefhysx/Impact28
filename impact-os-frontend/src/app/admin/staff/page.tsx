'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Eye, MoreHorizontal, Shield, UserCheck, UserMinus, ChevronDown, Users, X, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Select, Button } from '@/components/ui';
import { useToast } from '@/components/admin/Toast';
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
    setupCompleted: boolean;
    inviteTokenExpiresAt: string | null;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        lastLoginAt: string | null;
    };
}

// Helper: Get display name (use email prefix when name is placeholder)
function getDisplayName(user: StaffMember['user']): { name: string; isPlaceholder: boolean } {
    if (user.firstName === 'Pending' && user.lastName === 'Setup') {
        const emailName = user.email.split('@')[0].replace(/[._]/g, ' ');
        return { name: emailName, isPlaceholder: true };
    }
    return { name: `${user.firstName} ${user.lastName}`, isPlaceholder: false };
}

// Helper: Get staff status based on setupCompleted and isActive
function getStaffStatus(staff: StaffMember): { label: string; badge: string; icon: React.ReactNode } {
    if (!staff.isActive) {
        return { label: 'Deactivated', badge: 'badge-danger', icon: <X size={12} /> };
    }
    if (!staff.setupCompleted) {
        // Check if invite token has expired
        if (staff.inviteTokenExpiresAt && new Date(staff.inviteTokenExpiresAt) < new Date()) {
            return { label: 'Invite Expired', badge: 'badge-danger', icon: <AlertTriangle size={12} /> };
        }
        return { label: 'Pending Setup', badge: 'badge-warning', icon: <Clock size={12} /> };
    }
    return { label: 'Active', badge: 'badge-success', icon: <UserCheck size={12} /> };
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

// Map categories to their relevant templates
const CATEGORY_TEMPLATES: Record<string, string[]> = {
    'ADMIN': [],           // Admins get all capabilities — no template needed
    'STAFF': ['OPS', 'MENTOR', 'FINANCE'],
    'OBSERVER': ['IMPACT', 'PARTNER', 'VOLUNTEER'],
};

// Default template auto-selected for each category
const CATEGORY_DEFAULT_TEMPLATE: Record<string, string> = {
    'ADMIN': '',
    'STAFF': 'OPS',
    'OBSERVER': 'IMPACT',
};

export default function StaffPage() {
    const { showToast } = useToast();
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
    const [inviteTemplate, setInviteTemplate] = useState(CATEGORY_DEFAULT_TEMPLATE['STAFF']);
    const [inviteCohorts, setInviteCohorts] = useState<string[]>([]);
    const [inviteLoading, setInviteLoading] = useState(false);

    // Filter templates by selected category
    const relevantTemplates = templates.filter(t =>
        (CATEGORY_TEMPLATES[inviteCategory] || []).includes(t.id)
    );

    // When category changes, auto-select a default template and reset if current doesn't apply
    const handleCategoryChange = (val: string) => {
        const cat = val as 'ADMIN' | 'STAFF' | 'OBSERVER';
        setInviteCategory(cat);
        setInviteTemplate(CATEGORY_DEFAULT_TEMPLATE[cat] || '');
    };

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Fetch staff members
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const headers = {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                };

                const [staffRes, templatesRes, cohortsRes] = await Promise.all([
                    fetch(`${API_BASE}/staff`, { headers }),
                    fetch(`${API_BASE}/staff/templates`, { headers }),
                    fetch(`${API_BASE}/staff/cohorts`, { headers }),
                ]);

                if (staffRes.ok) {
                    const data = await staffRes.json();
                    setStaffMembers(data.staff || []);
                } else {
                    setStaffMembers([]);
                }

                if (templatesRes.ok) {
                    const tData = await templatesRes.json();
                    setTemplates(tData.templates || []);
                } else {
                    setTemplates([]);
                }

                if (cohortsRes.ok) {
                    const cData = await cohortsRes.json();
                    setCohorts(Array.isArray(cData) ? cData : []);
                } else {
                    setCohorts([]);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                setStaffMembers([]);
                setTemplates([]);
                setCohorts([]);
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
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE}/staff/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: inviteEmail,
                    category: inviteCategory,
                    templateId: inviteTemplate || undefined,
                    cohortIds: inviteCohorts,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to send invite (${response.status})`);
            }

            // Refresh staff list
            const refreshRes = await fetch(`${API_BASE}/staff`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setStaffMembers(data.staff || []);
            }

            // Reset form and close modal
            setInviteEmail('');
            setInviteCategory('STAFF');
            setInviteTemplate(CATEGORY_DEFAULT_TEMPLATE['STAFF']);
            setInviteCohorts([]);
            setShowInviteModal(false);

            // Show success feedback
            showToast('success', 'Invite sent successfully!');
        } catch (error) {
            console.error('Invite failed:', error);
            showToast('error', error instanceof Error ? error.message : 'Failed to send invite. Please try again.');
        } finally {
            setInviteLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
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
                            <th>Status</th>
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
                                <td colSpan={8} className={styles.loadingCell}>
                                    Loading staff members...
                                </td>
                            </tr>
                        ) : filteredStaff.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={styles.emptyCell}>
                                    {staffMembers.length === 0
                                        ? 'No staff members yet. Invite someone to get started.'
                                        : 'No staff members found matching your filters.'}
                                </td>
                            </tr>
                        ) : (
                            filteredStaff.map((staff) => {
                                const display = getDisplayName(staff.user);
                                const status = getStaffStatus(staff);
                                return (
                                    <tr key={staff.id}>
                                        <td>
                                            <div className={styles.staffInfo}>
                                                <div className={styles.avatar}>
                                                    {display.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className={styles.name}>
                                                        {display.name}
                                                        {display.isPlaceholder && (
                                                            <span className={styles.pendingTag}>invited</span>
                                                        )}
                                                        {staff.isSuperAdmin && (
                                                            <span className={styles.superBadge}>Super</span>
                                                        )}
                                                    </div>
                                                    <div className={styles.email}>{staff.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${status.badge}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
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
                                            <Button
                                                href={`/admin/staff/${staff.id}`}
                                                variant="primary"
                                                size="sm"
                                                icon={<Eye size={14} />}
                                            >
                                                Manage
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
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
                                <Button
                                    href={`/admin/staff/${staff.id}`}
                                    variant="primary"
                                    size="sm"
                                    icon={<Eye size={14} />}
                                    fullWidth
                                >
                                    Manage
                                </Button>
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
                                        onChange={handleCategoryChange}
                                        options={[
                                            { value: 'ADMIN', label: 'Admin', description: 'Full system access — no template needed' },
                                            { value: 'STAFF', label: 'Staff', description: 'Can execute assigned work' },
                                            { value: 'OBSERVER', label: 'Observer', description: 'Read-only access' },
                                        ]}
                                    />
                                </div>
                                {inviteCategory !== 'ADMIN' && (
                                    <div className={styles.formGroup}>
                                        <label>Role Template</label>
                                        <Select
                                            value={inviteTemplate}
                                            onChange={setInviteTemplate}
                                            placeholder="Select a role..."
                                            options={relevantTemplates.map((t) => ({
                                                value: t.id,
                                                label: t.label,
                                                description: t.description,
                                            }))}
                                        />
                                    </div>
                                )}
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
