'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Shield, UserCheck, Eye, UserMinus, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './page.module.css';

interface StaffDetail {
    id: string;
    category: 'ADMIN' | 'STAFF' | 'OBSERVER';
    isSuperAdmin: boolean;
    capabilities: string[];
    cohortIds: string[];
    queueIds: string[];
    participantIds: string[];
    isActive: boolean;
    invitedAt: string;
    invitedBy: string;
    deactivatedAt: string | null;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl: string | null;
        lastLoginAt: string | null;
        createdAt: string;
    };
    assignedCohorts: Array<{ id: string; name: string; isActive: boolean }>;
}

interface CapabilityGroup {
    label: string;
    capabilities: string[];
}

interface TemplatesResponse {
    templates: Array<{ id: string; label: string; description: string; capabilities: string[] }>;
    groups: Record<string, CapabilityGroup>;
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

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [staff, setStaff] = useState<StaffDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [capabilityGroups, setCapabilityGroups] = useState<Record<string, CapabilityGroup>>({});
    const [availableCohorts, setAvailableCohorts] = useState<Cohort[]>([]);

    // Edit state
    const [editCategory, setEditCategory] = useState<'ADMIN' | 'STAFF' | 'OBSERVER'>('STAFF');
    const [editCapabilities, setEditCapabilities] = useState<Set<string>>(new Set());
    const [editCohorts, setEditCohorts] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['program']));
    const [hasChanges, setHasChanges] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Mock data for demonstration
    const mockStaff: StaffDetail = {
        id: id,
        category: 'STAFF',
        isSuperAdmin: false,
        capabilities: ['admissions.manage', 'cohort.manage', 'reports.view', 'participants.view'],
        cohortIds: ['cohort-1'],
        queueIds: [],
        participantIds: [],
        isActive: true,
        invitedAt: '2026-01-05T00:00:00Z',
        invitedBy: 'admin-001',
        deactivatedAt: null,
        user: {
            id: 'u3',
            email: 'aisha.ibrahim@cycle28.org',
            firstName: 'Aisha',
            lastName: 'Ibrahim',
            avatarUrl: null,
            lastLoginAt: '2026-01-29T08:00:00Z',
            createdAt: '2026-01-05T00:00:00Z',
        },
        assignedCohorts: [
            { id: 'cohort-1', name: 'Cohort 28 - Lagos', isActive: true },
        ],
    };

    const mockCapabilityGroups: Record<string, CapabilityGroup> = {
        program: {
            label: 'Program Management',
            capabilities: ['admissions.manage', 'cohort.manage', 'reports.view'],
        },
        participants: {
            label: 'Participant Access',
            capabilities: ['participants.view', 'participants.edit', 'support.manage'],
        },
        financial: {
            label: 'Financial Operations',
            capabilities: ['income.review', 'income.approve', 'stipend.approve', 'budget.manage'],
        },
        staff: {
            label: 'Staff Administration',
            capabilities: ['staff.invite', 'staff.manage', 'admin.full'],
        },
    };

    const mockCohorts: Cohort[] = [
        { id: 'cohort-1', name: 'Cohort 28 - Lagos' },
        { id: 'cohort-2', name: 'Cohort 28 - Abuja' },
        { id: 'cohort-3', name: 'Cohort 29 - Lagos (Upcoming)' },
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [staffRes, templatesRes, cohortsRes] = await Promise.all([
                    fetch(`${API_BASE}/staff/${id}`),
                    fetch(`${API_BASE}/staff/templates`),
                    fetch(`${API_BASE}/staff/cohorts`),
                ]);

                if (staffRes.ok) {
                    const data = await staffRes.json();
                    setStaff(data);
                    setEditCategory(data.category);
                    setEditCapabilities(new Set(data.capabilities));
                    setEditCohorts(new Set(data.cohortIds));
                } else {
                    // Use mock data
                    setStaff(mockStaff);
                    setEditCategory(mockStaff.category);
                    setEditCapabilities(new Set(mockStaff.capabilities));
                    setEditCohorts(new Set(mockStaff.cohortIds));
                }

                if (templatesRes.ok) {
                    const tData: TemplatesResponse = await templatesRes.json();
                    setCapabilityGroups(tData.groups && Object.keys(tData.groups).length > 0 ? tData.groups : mockCapabilityGroups);
                } else {
                    setCapabilityGroups(mockCapabilityGroups);
                }

                if (cohortsRes.ok) {
                    const cData = await cohortsRes.json();
                    setAvailableCohorts(cData?.length > 0 ? cData : mockCohorts);
                } else {
                    setAvailableCohorts(mockCohorts);
                }
            } catch (error) {
                console.error('Failed to fetch staff data:', error);
                // Use mock data on error
                setStaff(mockStaff);
                setEditCategory(mockStaff.category);
                setEditCapabilities(new Set(mockStaff.capabilities));
                setEditCohorts(new Set(mockStaff.cohortIds));
                setCapabilityGroups(mockCapabilityGroups);
                setAvailableCohorts(mockCohorts);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE, id]);

    // Track changes
    useEffect(() => {
        if (!staff) return;
        const categoryChanged = editCategory !== staff.category;
        const capsChanged = JSON.stringify([...editCapabilities].sort()) !== JSON.stringify([...staff.capabilities].sort());
        const cohortsChanged = JSON.stringify([...editCohorts].sort()) !== JSON.stringify([...staff.cohortIds].sort());
        setHasChanges(categoryChanged || capsChanged || cohortsChanged);
    }, [staff, editCategory, editCapabilities, editCohorts]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const toggleCapability = (cap: string) => {
        const newCaps = new Set(editCapabilities);
        if (newCaps.has(cap)) {
            newCaps.delete(cap);
        } else {
            newCaps.add(cap);
        }
        setEditCapabilities(newCaps);
    };

    const toggleCohort = (cohortId: string) => {
        const newCohorts = new Set(editCohorts);
        if (newCohorts.has(cohortId)) {
            newCohorts.delete(cohortId);
        } else {
            newCohorts.add(cohortId);
        }
        setEditCohorts(newCohorts);
    };

    const toggleGroup = (groupKey: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedGroups(newExpanded);
    };

    const handleSave = async () => {
        if (!staff) return;
        setSaving(true);
        try {
            const response = await fetch(`${API_BASE}/staff/${staff.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: editCategory,
                    capabilities: [...editCapabilities],
                    cohortIds: [...editCohorts],
                }),
            });

            if (response.ok) {
                const updated = await response.json();
                setStaff({ ...staff, ...updated });
                setHasChanges(false);
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!staff || !confirm('Are you sure you want to deactivate this staff member?')) return;
        try {
            const response = await fetch(`${API_BASE}/staff/${staff.id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                window.location.href = '/admin/staff';
            }
        } catch (error) {
            console.error('Deactivate failed:', error);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading staff member...</div>
            </div>
        );
    }

    if (!staff) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Staff member not found</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/admin/staff" className={styles.backLink}>
                    <ArrowLeft size={18} />
                    Back to Staff
                </Link>
                <div className={styles.headerActions}>
                    {hasChanges && (
                        <button className={styles.saveButton} onClick={handleSave} disabled={saving}>
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                    {!staff.isSuperAdmin && (
                        <button className={styles.deactivateButton} onClick={handleDeactivate}>
                            <UserMinus size={16} />
                            Deactivate
                        </button>
                    )}
                </div>
            </div>

            {/* Staff Profile */}
            <div className={styles.profileCard}>
                <div className={styles.profileMain}>
                    <div className={styles.avatar}>
                        {staff.user.firstName[0]}{staff.user.lastName[0]}
                    </div>
                    <div className={styles.profileInfo}>
                        <h1 className={styles.profileName}>
                            {staff.user.firstName} {staff.user.lastName}
                            {staff.isSuperAdmin && <span className={styles.superBadge}>Super Admin</span>}
                        </h1>
                        <p className={styles.profileEmail}>{staff.user.email}</p>
                    </div>
                </div>
                <div className={styles.profileMeta}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Invited</span>
                        <span className={styles.metaValue}>{formatDate(staff.invitedAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Last Active</span>
                        <span className={styles.metaValue}>{formatDate(staff.user.lastLoginAt)}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Status</span>
                        <span className={`badge ${staff.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.twoColumn}>
                {/* Category & Capabilities */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Category & Capabilities</h2>

                    {/* Category Selector */}
                    <div className={styles.categorySelector}>
                        {(['ADMIN', 'STAFF', 'OBSERVER'] as const).map((cat) => (
                            <button
                                key={cat}
                                className={`${styles.categoryButton} ${editCategory === cat ? styles.selected : ''}`}
                                onClick={() => setEditCategory(cat)}
                            >
                                {categoryIcons[cat]}
                                <span className={styles.categoryLabel}>{cat}</span>
                                <span className={styles.categoryDesc}>
                                    {cat === 'ADMIN' && 'Can change the system'}
                                    {cat === 'STAFF' && 'Can execute assigned work'}
                                    {cat === 'OBSERVER' && 'Read-only access'}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Capability Groups */}
                    <div className={styles.capabilityList}>
                        {Object.entries(capabilityGroups).map(([key, group]) => (
                            <div key={key} className={styles.capGroup}>
                                <button
                                    className={styles.capGroupHeader}
                                    onClick={() => toggleGroup(key)}
                                >
                                    <span>{group.label}</span>
                                    <span className={styles.capGroupCount}>
                                        {group.capabilities.filter(c => editCapabilities.has(c)).length}/{group.capabilities.length}
                                    </span>
                                    {expandedGroups.has(key) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                                {expandedGroups.has(key) && (
                                    <div className={styles.capGroupItems}>
                                        {group.capabilities.map((cap) => (
                                            <label key={cap} className={styles.capItem}>
                                                <input
                                                    type="checkbox"
                                                    checked={editCapabilities.has(cap)}
                                                    onChange={() => toggleCapability(cap)}
                                                />
                                                <span className={styles.capName}>{cap}</span>
                                                {editCapabilities.has(cap) ? (
                                                    <Check size={14} className={styles.capCheck} />
                                                ) : null}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scope Assignment */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Scope Assignment</h2>
                    <p className={styles.sectionDesc}>
                        Limit this staff member's access to specific cohorts. Leave empty for full access.
                    </p>

                    <div className={styles.cohortList}>
                        {availableCohorts.length === 0 ? (
                            <p className={styles.emptyState}>No cohorts available</p>
                        ) : (
                            availableCohorts.map((cohort) => (
                                <label key={cohort.id} className={styles.cohortItem}>
                                    <input
                                        type="checkbox"
                                        checked={editCohorts.has(cohort.id)}
                                        onChange={() => toggleCohort(cohort.id)}
                                    />
                                    <span>{cohort.name}</span>
                                </label>
                            ))
                        )}
                    </div>

                    {editCohorts.size === 0 && (
                        <div className={styles.scopeNote}>
                            <Shield size={14} />
                            Has access to all cohorts
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
