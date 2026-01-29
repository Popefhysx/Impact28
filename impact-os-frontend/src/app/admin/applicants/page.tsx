'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, FileText, Eye, Check, X, Clock, AlertCircle, ChevronDown, Users, CheckSquare, Square, UserCheck, UserX, Grid, List } from 'lucide-react';
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

interface CohortCapacity {
    capacity: number;
    filled: number;
    remaining: number;
    isAtCapacity: boolean;
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
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [scoreFilter, setScoreFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [capacity, setCapacity] = useState<CohortCapacity>({ capacity: 50, filled: 12, remaining: 38, isAtCapacity: false });
    const [bulkLoading, setBulkLoading] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    // Fetch applicants and capacity
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [applicantsRes, capacityRes] = await Promise.all([
                    fetch(`${API_BASE}/admin/applicants`),
                    fetch(`${API_BASE}/admin/cohort/capacity`),
                ]);

                if (applicantsRes.ok) {
                    const data = await applicantsRes.json();
                    setApplicants(data);
                }

                if (capacityRes.ok) {
                    const capData = await capacityRes.json();
                    setCapacity(capData);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE]);

    // Filter applicants
    const filteredApplicants = applicants.filter(app => {
        const matchesSearch = search === '' ||
            app.firstName.toLowerCase().includes(search.toLowerCase()) ||
            app.lastName.toLowerCase().includes(search.toLowerCase()) ||
            app.email.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === '' || app.status === statusFilter;

        const matchesScore = scoreFilter === '' || (() => {
            const score = app.readinessScore;
            if (!score) return scoreFilter === 'unscored';
            if (scoreFilter === 'high') return score >= 75;
            if (scoreFilter === 'medium') return score >= 50 && score < 75;
            if (scoreFilter === 'low') return score < 50;
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

    // Bulk actions
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

    const capacityPercent = Math.round((capacity.filled / capacity.capacity) * 100);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Applicants</h1>
                    <p className={styles.subtitle}>Review and manage incoming applications</p>
                </div>
                <div className={styles.headerStats}>
                    {/* Cohort Capacity Indicator */}
                    <div className={styles.capacityCard}>
                        <Users size={18} />
                        <div className={styles.capacityInfo}>
                            <span className={styles.capacityLabel}>Cohort Capacity</span>
                            <span className={styles.capacityValue}>
                                {capacity.filled}/{capacity.capacity} spots
                            </span>
                        </div>
                        <div className={styles.capacityBar}>
                            <div
                                className={`${styles.capacityFill} ${capacity.isAtCapacity ? styles.full : ''}`}
                                style={{ width: `${capacityPercent}%` }}
                            />
                        </div>
                    </div>
                    <span className={styles.statBadge}>
                        <Clock size={14} /> {applicants.filter(a => a.status === 'PENDING').length} pending
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
                            disabled={bulkLoading || capacity.remaining < selectedIds.size}
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
                <div className={styles.toolbarRight}>
                    <div className="view-toggle">
                        <button
                            className={viewMode === 'table' ? 'active' : ''}
                            onClick={() => setViewMode('table')}
                            title="Table view"
                        >
                            <List size={16} />
                        </button>
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                            title="Grid view"
                        >
                            <Grid size={16} />
                        </button>
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
            </div>

            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGroup}>
                        <label>Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="SCORING">Scoring</option>
                            <option value="SCORED">Scored</option>
                            <option value="ADMITTED">Admitted</option>
                            <option value="CONDITIONAL">Conditional</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>Readiness Score</label>
                        <select
                            value={scoreFilter}
                            onChange={(e) => setScoreFilter(e.target.value)}
                        >
                            <option value="">All Scores</option>
                            <option value="high">High (75+)</option>
                            <option value="medium">Medium (50-74)</option>
                            <option value="low">Low (&lt;50)</option>
                            <option value="unscored">Unscored</option>
                        </select>
                    </div>
                </div>
            )}

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
