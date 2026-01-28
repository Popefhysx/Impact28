'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, FileText, Eye, Check, X, Clock, AlertCircle, ChevronDown } from 'lucide-react';
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
    const [showFilters, setShowFilters] = useState(false);

    // Mock data for now - will connect to backend
    useEffect(() => {
        // Simulating API call
        const mockApplicants: Applicant[] = [
            {
                id: 'app_1',
                email: 'adaeze@email.com',
                firstName: 'Adaeze',
                lastName: 'Okonkwo',
                status: 'PENDING',
                skillTrack: 'DESIGN',
                readinessScore: 78,
                aiRecommendation: 'ADMIT',
                startedAt: '2026-01-25T10:00:00Z',
                submittedAt: '2026-01-25T14:30:00Z',
            },
            {
                id: 'app_2',
                email: 'chidi@email.com',
                firstName: 'Chidi',
                lastName: 'Eze',
                status: 'SCORED',
                skillTrack: 'DEVELOPMENT',
                readinessScore: 85,
                aiRecommendation: 'ADMIT',
                startedAt: '2026-01-24T09:00:00Z',
                submittedAt: '2026-01-24T16:00:00Z',
            },
            {
                id: 'app_3',
                email: 'ngozi@email.com',
                firstName: 'Ngozi',
                lastName: 'Ibe',
                status: 'ADMITTED',
                skillTrack: 'DIGITAL_MARKETING',
                readinessScore: 92,
                aiRecommendation: 'ADMIT',
                startedAt: '2026-01-23T11:00:00Z',
                submittedAt: '2026-01-23T15:45:00Z',
            },
            {
                id: 'app_4',
                email: 'emeka@email.com',
                firstName: 'Emeka',
                lastName: 'Nnamdi',
                status: 'CONDITIONAL',
                skillTrack: 'DATA_ANALYTICS',
                readinessScore: 62,
                aiRecommendation: 'CONDITIONAL',
                startedAt: '2026-01-22T14:00:00Z',
                submittedAt: '2026-01-22T18:20:00Z',
            },
            {
                id: 'app_5',
                email: 'amara@email.com',
                firstName: 'Amara',
                lastName: 'Okoro',
                status: 'PENDING',
                skillTrack: 'DEVELOPMENT',
                readinessScore: null,
                aiRecommendation: null,
                startedAt: '2026-01-28T08:00:00Z',
                submittedAt: '2026-01-28T12:00:00Z',
            },
        ];

        setTimeout(() => {
            setApplicants(mockApplicants);
            setLoading(false);
        }, 500);
    }, []);

    // Filter applicants
    const filteredApplicants = applicants.filter(app => {
        const matchesSearch = search === '' ||
            app.firstName.toLowerCase().includes(search.toLowerCase()) ||
            app.lastName.toLowerCase().includes(search.toLowerCase()) ||
            app.email.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter === '' || app.status === statusFilter;

        return matchesSearch && matchesStatus;
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

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Applicants</h1>
                    <p className={styles.subtitle}>Review and manage incoming applications</p>
                </div>
                <div className={styles.headerStats}>
                    <span className={styles.statBadge}>
                        <Clock size={14} /> {applicants.filter(a => a.status === 'PENDING').length} pending review
                    </span>
                </div>
            </header>

            {/* Search and Filters */}
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
                </div>
            )}

            {/* Applicants Table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
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
                                <td colSpan={7} className={styles.loadingCell}>
                                    Loading applicants...
                                </td>
                            </tr>
                        ) : filteredApplicants.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>
                                    No applicants found
                                </td>
                            </tr>
                        ) : (
                            filteredApplicants.map((applicant) => (
                                <tr key={applicant.id}>
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
        </div>
    );
}
