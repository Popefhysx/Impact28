'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Eye, Check, X, Clock, AlertCircle, Users, CheckSquare, Square, UserCheck, UserX } from 'lucide-react';
import { SearchFilterBar, FilterConfig } from '@/components/admin/SearchFilterBar';
import styles from './page.module.css';

// Types
interface Applicant {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    skillTrack: string | null;
    readinessScore: number | null;
    aiRecommendation: string | null;
    startedAt: string;
    submittedAt: string | null;
}

// Pipeline stats instead of capacity (per PRD §6 - admission based on readiness, not capacity)
interface PipelineStats {
    total: number;
    pending: number;
    scored: number;
    admitted: number;
    rejected: number;
    conditional: number;
}

const statusColors: Record<string, string> = {
    'DRAFT': 'badge-muted',
    'PENDING': 'badge-warning',
    'SCORING': 'badge-info',
    'SCORED': 'badge-gold',
    'ADMITTED': 'badge-success',
    'CONDITIONAL': 'badge-warning',
    'REJECTED': 'badge-danger',
};

const statusIcons: Record<string, React.ReactNode> = {
    'DRAFT': <Clock size={14} />,
    'PENDING': <Clock size={14} />,
    'SCORING': <AlertCircle size={14} />,
    'SCORED': <FileText size={14} />,
    'ADMITTED': <Check size={14} />,
    'CONDITIONAL': <AlertCircle size={14} />,
    'REJECTED': <X size={14} />,
};

export default function ApplicantsPage() {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterValues, setFilterValues] = useState<Record<string, string>>({
        status: 'ALL',
        score: 'ALL',
    });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [bulkLoading, setBulkLoading] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Mock data for demonstration
    const mockApplicants: Applicant[] = [
        {
            id: 'app-001',
            email: 'oluwaseun.adebayo@email.com',
            firstName: 'Oluwaseun',
            lastName: 'Adebayo',
            status: 'SCORED',
            skillTrack: 'GRAPHIC_DESIGN',
            readinessScore: 87,
            aiRecommendation: 'ADMIT',
            startedAt: '2026-01-25T09:30:00Z',
            submittedAt: '2026-01-25T14:45:00Z',
        },
        {
            id: 'app-002',
            email: 'blessing.ojo@email.com',
            firstName: 'Blessing',
            lastName: 'Ojo',
            status: 'SCORED',
            skillTrack: 'WEB_DEVELOPMENT',
            readinessScore: 92,
            aiRecommendation: 'ADMIT',
            startedAt: '2026-01-24T11:00:00Z',
            submittedAt: '2026-01-24T16:30:00Z',
        },
        {
            id: 'app-003',
            email: 'chioma.nwosu@email.com',
            firstName: 'Chioma',
            lastName: 'Nwosu',
            status: 'PENDING',
            skillTrack: 'DIGITAL_MARKETING',
            readinessScore: null,
            aiRecommendation: null,
            startedAt: '2026-01-28T08:00:00Z',
            submittedAt: '2026-01-28T12:15:00Z',
        },
        {
            id: 'app-004',
            email: 'yusuf.ibrahim@email.com',
            firstName: 'Yusuf',
            lastName: 'Ibrahim',
            status: 'SCORED',
            skillTrack: 'VIDEO_EDITING',
            readinessScore: 58,
            aiRecommendation: 'CONDITIONAL',
            startedAt: '2026-01-22T15:30:00Z',
            submittedAt: '2026-01-23T09:00:00Z',
        },
        {
            id: 'app-005',
            email: 'funke.adesanya@email.com',
            firstName: 'Funke',
            lastName: 'Adesanya',
            status: 'DRAFT',
            skillTrack: null,
            readinessScore: null,
            aiRecommendation: null,
            startedAt: '2026-01-29T10:00:00Z',
            submittedAt: null,
        },
        {
            id: 'app-006',
            email: 'godwin.obi@email.com',
            firstName: 'Godwin',
            lastName: 'Obi',
            status: 'ADMITTED',
            skillTrack: 'VIRTUAL_ASSISTANT',
            readinessScore: 81,
            aiRecommendation: 'ADMIT',
            startedAt: '2026-01-18T14:00:00Z',
            submittedAt: '2026-01-18T18:30:00Z',
        },
        {
            id: 'app-007',
            email: 'kemi.bello@email.com',
            firstName: 'Kemi',
            lastName: 'Bello',
            status: 'REJECTED',
            skillTrack: 'DATA_ENTRY',
            readinessScore: 32,
            aiRecommendation: 'REJECT',
            startedAt: '2026-01-15T09:00:00Z',
            submittedAt: '2026-01-15T13:45:00Z',
        },
        {
            id: 'app-008',
            email: 'tunde.akande@email.com',
            firstName: 'Tunde',
            lastName: 'Akande',
            status: 'CONDITIONAL',
            skillTrack: 'GRAPHIC_DESIGN',
            readinessScore: 65,
            aiRecommendation: 'CONDITIONAL',
            startedAt: '2026-01-20T11:30:00Z',
            submittedAt: '2026-01-20T17:00:00Z',
        },
    ];

    // Fetch applicants
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const applicantsRes = await fetch(`${API_BASE}/admin/applicants`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (applicantsRes.ok) {
                    const data = await applicantsRes.json();
                    setApplicants(data?.length > 0 ? data : (process.env.NODE_ENV !== 'production' ? mockApplicants : []));
                } else if (process.env.NODE_ENV !== 'production') {
                    setApplicants(mockApplicants);
                } else {
                    setApplicants([]);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
                if (process.env.NODE_ENV !== 'production') {
                    setApplicants(mockApplicants);
                } else {
                    setApplicants([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    // Compute pipeline stats from applicants (readiness-based, not capacity-based)
    const pipelineStats: PipelineStats = {
        total: applicants.length,
        pending: applicants.filter(a => a.status === 'PENDING' || a.status === 'SCORING').length,
        scored: applicants.filter(a => a.status === 'SCORED').length,
        admitted: applicants.filter(a => a.status === 'ADMITTED').length,
        rejected: applicants.filter(a => a.status === 'REJECTED').length,
        conditional: applicants.filter(a => a.status === 'CONDITIONAL').length,
    };

    // Filter applicants
    const filteredApplicants = applicants.filter(app => {
        const matchesSearch = search === '' ||
            app.firstName.toLowerCase().includes(search.toLowerCase()) ||
            app.lastName.toLowerCase().includes(search.toLowerCase()) ||
            app.email.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = filterValues.status === 'ALL' || app.status === filterValues.status;

        const matchesScore = filterValues.score === 'ALL' || (() => {
            const score = app.readinessScore;
            if (!score) return filterValues.score === 'unscored';
            if (filterValues.score === 'high') return score >= 75;
            if (filterValues.score === 'medium') return score >= 50 && score < 75;
            if (filterValues.score === 'low') return score < 50;
            return true;
        })();

        return matchesSearch && matchesStatus && matchesScore;
    });

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Selection handlers
    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredApplicants.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredApplicants.map(a => a.id)));
        }
    };

    // Bulk actions - NO capacity check per PRD §6 (admission based on readiness, not capacity)
    const handleBulkAction = async (decision: 'ADMITTED' | 'REJECTED') => {
        if (selectedIds.size === 0) return;

        setBulkLoading(true);
        try {
            const response = await fetch(`${API_BASE}/admin/applicants/bulk-decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicantIds: Array.from(selectedIds),
                    decision,
                }),
            });

            if (response.ok) {
                // Refresh applicants
                const refreshRes = await fetch(`${API_BASE}/admin/applicants`);
                if (refreshRes.ok) {
                    setApplicants(await refreshRes.json());
                }
                setSelectedIds(new Set());
            }
        } catch (error) {
            console.error('Bulk action failed:', error);
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Applicants</h1>
                    <p className={styles.subtitle}>Review and manage incoming applications</p>
                </div>
                <div className={styles.headerStats}>
                    {/* Pipeline Stats - Readiness-based, not capacity-based */}
                    <span className={styles.statBadge}>
                        <Users size={14} /> {pipelineStats.total} total
                    </span>
                    <span className={styles.statBadge}>
                        <Clock size={14} /> {pipelineStats.pending} pending
                    </span>
                    <span className={styles.statBadge}>
                        <FileText size={14} /> {pipelineStats.scored} awaiting decision
                    </span>
                    <span className={`${styles.statBadge} ${styles.successStat}`}>
                        <Check size={14} /> {pipelineStats.admitted} admitted
                    </span>
                </div>
            </header>

            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className={styles.bulkBar}>
                    <span className={styles.bulkCount}>{selectedIds.size} selected</span>
                    <div className={styles.bulkActions}>
                        <button
                            className={styles.bulkApprove}
                            onClick={() => handleBulkAction('ADMITTED')}
                            disabled={bulkLoading}
                        >
                            <UserCheck size={16} />
                            Approve Selected
                        </button>
                        <button
                            className={styles.bulkReject}
                            onClick={() => handleBulkAction('REJECTED')}
                            disabled={bulkLoading}
                        >
                            <UserX size={16} />
                            Reject Selected
                        </button>
                        <button
                            className={styles.bulkClear}
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Search, Filters, and View Toggle */}
            <SearchFilterBar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by name or email..."
                filters={[
                    {
                        key: 'status',
                        placeholder: 'Status',
                        options: [
                            { value: 'ALL', label: 'All Statuses' },
                            { value: 'PENDING', label: 'Pending' },
                            { value: 'SCORING', label: 'Scoring' },
                            { value: 'SCORED', label: 'Scored' },
                            { value: 'ADMITTED', label: 'Admitted' },
                            { value: 'CONDITIONAL', label: 'Conditional' },
                            { value: 'REJECTED', label: 'Rejected' },
                        ],
                    },
                    {
                        key: 'score',
                        placeholder: 'Score',
                        options: [
                            { value: 'ALL', label: 'All Scores' },
                            { value: 'high', label: 'High (75+)' },
                            { value: 'medium', label: 'Medium (50-74)' },
                            { value: 'low', label: 'Low (<50)' },
                            { value: 'unscored', label: 'Unscored' },
                        ],
                    },
                ]}
                filterValues={filterValues}
                onFilterChange={(key, value) =>
                    setFilterValues((prev) => ({ ...prev, [key]: value }))
                }
                viewMode={viewMode === 'table' ? 'list' : 'grid'}
                onViewModeChange={(mode) =>
                    setViewMode(mode === 'list' ? 'table' : 'grid')
                }
                showViewToggle={true}
            />

            {/* Table View */}
            {viewMode === 'table' && (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.checkboxCell}>
                                    <button onClick={toggleSelectAll} className={styles.checkboxBtn}>
                                        {selectedIds.size === filteredApplicants.length && filteredApplicants.length > 0
                                            ? <CheckSquare size={18} />
                                            : <Square size={18} />
                                        }
                                    </button>
                                </th>
                                <th>Applicant</th>
                                <th>Skill Track</th>
                                <th>Status</th>
                                <th>Score</th>
                                <th>AI Recommendation</th>
                                <th>Submitted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className={styles.loadingCell}>
                                        Loading applicants...
                                    </td>
                                </tr>
                            ) : filteredApplicants.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={styles.emptyCell}>
                                        No applicants found
                                    </td>
                                </tr>
                            ) : (
                                filteredApplicants.map((applicant) => (
                                    <tr key={applicant.id} className={selectedIds.has(applicant.id) ? styles.selectedRow : ''}>
                                        <td className={styles.checkboxCell}>
                                            <button onClick={() => toggleSelect(applicant.id)} className={styles.checkboxBtn}>
                                                {selectedIds.has(applicant.id)
                                                    ? <CheckSquare size={18} />
                                                    : <Square size={18} />
                                                }
                                            </button>
                                        </td>
                                        <td>
                                            <div className={styles.applicantInfo}>
                                                <div className={styles.avatar}>
                                                    {applicant.firstName[0]}{applicant.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className={styles.name}>
                                                        {applicant.firstName} {applicant.lastName}
                                                    </div>
                                                    <div className={styles.email}>{applicant.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={styles.trackBadge}>
                                                {applicant.skillTrack?.replace('_', ' ') || '—'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${statusColors[applicant.status] || ''}`}>
                                                {statusIcons[applicant.status]}
                                                {applicant.status}
                                            </span>
                                        </td>
                                        <td>
                                            {applicant.readinessScore !== null ? (
                                                <span className={styles.scoreValue}>
                                                    {applicant.readinessScore}%
                                                </span>
                                            ) : (
                                                <span className={styles.noScore}>—</span>
                                            )}
                                        </td>
                                        <td>
                                            {applicant.aiRecommendation ? (
                                                <span className={`badge ${applicant.aiRecommendation === 'ADMIT' ? 'badge-success' :
                                                    applicant.aiRecommendation === 'CONDITIONAL' ? 'badge-warning' :
                                                        'badge-danger'
                                                    }`}>
                                                    {applicant.aiRecommendation}
                                                </span>
                                            ) : (
                                                <span className={styles.pending}>Pending</span>
                                            )}
                                        </td>
                                        <td className={styles.dateCell}>
                                            {formatDate(applicant.submittedAt)}
                                        </td>
                                        <td>
                                            <Link
                                                href={`/admin/applicants/${applicant.id}`}
                                                className={styles.viewButton}
                                            >
                                                <Eye size={16} />
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Grid View (Mobile-friendly) */}
            {viewMode === 'grid' && (
                <div className={styles.gridView}>
                    {loading ? (
                        <div className={styles.loadingCell}>Loading applicants...</div>
                    ) : filteredApplicants.length === 0 ? (
                        <div className={styles.emptyCell}>No applicants found</div>
                    ) : (
                        filteredApplicants.map((applicant) => (
                            <div
                                key={applicant.id}
                                className={`${styles.applicantCard} ${selectedIds.has(applicant.id) ? styles.selectedCard : ''}`}
                            >
                                <div className={styles.cardHeader}>
                                    <button onClick={() => toggleSelect(applicant.id)} className={styles.checkboxBtn}>
                                        {selectedIds.has(applicant.id)
                                            ? <CheckSquare size={18} />
                                            : <Square size={18} />
                                        }
                                    </button>
                                    <div className={styles.applicantInfo}>
                                        <div className={styles.avatar}>
                                            {applicant.firstName[0]}{applicant.lastName[0]}
                                        </div>
                                        <div>
                                            <div className={styles.name}>
                                                {applicant.firstName} {applicant.lastName}
                                            </div>
                                            <div className={styles.email}>{applicant.email}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>Track</span>
                                        <span className={styles.trackBadge}>
                                            {applicant.skillTrack?.replace('_', ' ') || '—'}
                                        </span>
                                    </div>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>Status</span>
                                        <span className={`badge ${statusColors[applicant.status] || ''}`}>
                                            {statusIcons[applicant.status]}
                                            {applicant.status}
                                        </span>
                                    </div>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>Score</span>
                                        <span className={styles.scoreValue}>
                                            {applicant.readinessScore !== null ? `${applicant.readinessScore}%` : '—'}
                                        </span>
                                    </div>
                                    <div className={styles.cardRow}>
                                        <span className={styles.cardLabel}>AI Rec</span>
                                        {applicant.aiRecommendation ? (
                                            <span className={`badge ${applicant.aiRecommendation === 'ADMIT' ? 'badge-success' :
                                                applicant.aiRecommendation === 'CONDITIONAL' ? 'badge-warning' : 'badge-danger'
                                                }`}>
                                                {applicant.aiRecommendation}
                                            </span>
                                        ) : (
                                            <span className={styles.pending}>Pending</span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.cardFooter}>
                                    <span className={styles.dateCell}>{formatDate(applicant.submittedAt)}</span>
                                    <Link href={`/admin/applicants/${applicant.id}`} className={styles.viewButton}>
                                        <Eye size={16} /> Review
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
