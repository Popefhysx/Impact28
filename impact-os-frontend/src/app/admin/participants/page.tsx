'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, User, Zap, Star, Trophy, ChevronRight, MoreHorizontal, Grid, List, Loader2 } from 'lucide-react';
import styles from './page.module.css';

// Types for participants
interface Participant {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    skillTrack: string;
    identityLevel: string;
    momentum: number;
    daysInProgram: number;
    isActive: boolean;
    cohort: string;
}

// Mock data for development only
const mockParticipants: Participant[] = [
    {
        id: 'user-001',
        firstName: 'Adaeze',
        lastName: 'Okonkwo',
        email: 'adaeze@email.com',
        skillTrack: 'GRAPHIC_DESIGN',
        identityLevel: 'L3_EXPOSED',
        momentum: 82,
        daysInProgram: 45,
        isActive: true,
        cohort: 'Cohort 12',
    },
    {
        id: 'user-002',
        firstName: 'Chidi',
        lastName: 'Eze',
        email: 'chidi.eze@email.com',
        skillTrack: 'WEB_DEVELOPMENT',
        identityLevel: 'L4_EARNER',
        momentum: 95,
        daysInProgram: 78,
        isActive: true,
        cohort: 'Cohort 11',
    },
    {
        id: 'user-003',
        firstName: 'Ngozi',
        lastName: 'Ibe',
        email: 'ngozi@email.com',
        skillTrack: 'DIGITAL_MARKETING',
        identityLevel: 'L2_SKILLED',
        momentum: 45,
        daysInProgram: 30,
        isActive: false,
        cohort: 'Cohort 12',
    },
    {
        id: 'user-004',
        firstName: 'Emeka',
        lastName: 'Nnamdi',
        email: 'emeka.n@email.com',
        skillTrack: 'VIDEO_EDITING',
        identityLevel: 'L2_SKILLED',
        momentum: 68,
        daysInProgram: 22,
        isActive: true,
        cohort: 'Cohort 12',
    },
    {
        id: 'user-005',
        firstName: 'Amara',
        lastName: 'Okoro',
        email: 'amara.o@email.com',
        skillTrack: 'VIRTUAL_ASSISTANT',
        identityLevel: 'L5_CATALYST',
        momentum: 100,
        daysInProgram: 120,
        isActive: true,
        cohort: 'Cohort 10',
    },
];

const levelLabels: Record<string, { label: string; color: string }> = {
    'L1_ACTIVATED': { label: 'L1 Activated', color: 'var(--text-secondary)' },
    'L2_SKILLED': { label: 'L2 Skilled', color: 'var(--gold-warm)' },
    'L3_EXPOSED': { label: 'L3 Exposed', color: 'var(--navy-medium)' },
    'L4_EARNER': { label: 'L4 Earner', color: 'var(--accent-success)' },
    'L5_CATALYST': { label: 'L5 Catalyst', color: 'var(--gold-dark)' },
};

const skillLabels: Record<string, string> = {
    'GRAPHIC_DESIGN': 'Graphics',
    'WEB_DEVELOPMENT': 'Web Dev',
    'DIGITAL_MARKETING': 'Marketing',
    'VIDEO_EDITING': 'Video',
    'VIRTUAL_ASSISTANT': 'VA',
    'DATA_ENTRY': 'Data Entry',
};

function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function ParticipantsPage() {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_BASE}/admin/participants`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setParticipants(data?.length > 0 ? data : (process.env.NODE_ENV !== 'production' ? mockParticipants : []));
                } else if (process.env.NODE_ENV !== 'production') {
                    setParticipants(mockParticipants);
                } else {
                    setParticipants([]);
                }
            } catch (error) {
                console.error('Failed to fetch participants:', error);
                if (process.env.NODE_ENV !== 'production') {
                    setParticipants(mockParticipants);
                } else {
                    setParticipants([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchParticipants();
    }, [API_BASE]);

    const filteredParticipants = participants.filter(p => {
        const matchesSearch = searchQuery === '' ||
            `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLevel = levelFilter === '' || p.identityLevel === levelFilter;
        const matchesStatus = statusFilter === '' ||
            (statusFilter === 'active' && p.isActive) ||
            (statusFilter === 'paused' && !p.isActive);
        return matchesSearch && matchesLevel && matchesStatus;
    });

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Loading participants...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Participants</h1>
                <p className={styles.subtitle}>{participants.length} total participants</p>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                        <option value="">All Levels</option>
                        <option value="L1_ACTIVATED">L1 Activated</option>
                        <option value="L2_SKILLED">L2 Skilled</option>
                        <option value="L3_EXPOSED">L3 Exposed</option>
                        <option value="L4_EARNER">L4 Earner</option>
                        <option value="L5_CATALYST">L5 Catalyst</option>
                    </select>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                    </select>
                </div>
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Table view"
                    >
                        <List size={16} />
                    </button>
                    <button
                        className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                    >
                        <Grid size={16} />
                    </button>
                </div>
            </div>

            {/* Participants Table - Hidden on mobile via CSS */}
            <div className={`card ${styles.tableCard} ${viewMode === 'table' ? '' : styles.hidden}`}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Participant</th>
                            <th>Level</th>
                            <th>Skill Track</th>
                            <th>Momentum</th>
                            <th>Days</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredParticipants.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyCell}>
                                    No participants found
                                </td>
                            </tr>
                        ) : (
                            filteredParticipants.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className={styles.participantCell}>
                                            <div className={styles.avatar}>
                                                {getInitials(p.firstName, p.lastName)}
                                            </div>
                                            <div className={styles.participantInfo}>
                                                <span className={styles.name}>{p.firstName} {p.lastName}</span>
                                                <span className={styles.email}>{p.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={styles.levelBadge}
                                            style={{ color: levelLabels[p.identityLevel]?.color }}
                                        >
                                            {levelLabels[p.identityLevel]?.label}
                                        </span>
                                    </td>
                                    <td>{skillLabels[p.skillTrack] || p.skillTrack}</td>
                                    <td>
                                        <div className={styles.momentumCell}>
                                            <Zap size={14} />
                                            <span className={p.momentum < 50 ? styles.lowMomentum : ''}>
                                                {p.momentum}
                                            </span>
                                        </div>
                                    </td>
                                    <td>{p.daysInProgram}</td>
                                    <td>
                                        {p.isActive ? (
                                            <span className="badge badge-success">Active</span>
                                        ) : (
                                            <span className="badge badge-warning">Paused</span>
                                        )}
                                    </td>
                                    <td>
                                        <Link href={`/admin/participants/${p.id}`} className={styles.viewBtn}>
                                            <ChevronRight size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Grid View - Always visible on mobile, toggled on desktop */}
            <div className={`${styles.gridView} ${viewMode === 'grid' ? '' : styles.hiddenDesktop}`}>
                {filteredParticipants.length === 0 ? (
                    <div className={styles.emptyCell}>No participants found</div>
                ) : (
                    filteredParticipants.map((p) => (
                        <div key={p.id} className={styles.participantCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.participantCell}>
                                    <div className={styles.avatar}>
                                        {getInitials(p.firstName, p.lastName)}
                                    </div>
                                    <div className={styles.participantInfo}>
                                        <span className={styles.name}>{p.firstName} {p.lastName}</span>
                                        <span className={styles.email}>{p.email}</span>
                                    </div>
                                </div>
                                {p.isActive ? (
                                    <span className="badge badge-success">Active</span>
                                ) : (
                                    <span className="badge badge-warning">Paused</span>
                                )}
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.cardRow}>
                                    <span className={styles.cardLabel}>Level</span>
                                    <span
                                        className={styles.levelBadge}
                                        style={{ color: levelLabels[p.identityLevel]?.color }}
                                    >
                                        {levelLabels[p.identityLevel]?.label}
                                    </span>
                                </div>
                                <div className={styles.cardRow}>
                                    <span className={styles.cardLabel}>Skill Track</span>
                                    <span>{skillLabels[p.skillTrack] || p.skillTrack}</span>
                                </div>
                                <div className={styles.cardRow}>
                                    <span className={styles.cardLabel}>Momentum</span>
                                    <div className={styles.momentumCell}>
                                        <Zap size={14} />
                                        <span className={p.momentum < 50 ? styles.lowMomentum : ''}>
                                            {p.momentum}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.cardRow}>
                                    <span className={styles.cardLabel}>Days in Program</span>
                                    <span>{p.daysInProgram}</span>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <span className={styles.cohortLabel}>{p.cohort}</span>
                                <Link href={`/admin/participants/${p.id}`} className={styles.viewBtn}>
                                    View <ChevronRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
