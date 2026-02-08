'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FileText, Users, DollarSign, Target, MessageSquareQuote,
    Loader2, AlertCircle, Handshake, Bell, CalendarDays,
    Shield, ChevronRight, ClipboardCheck,
    Activity, Pause, GraduationCap
} from 'lucide-react';
import { StatCard } from '@/components/ui';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ─── Types ─────────────────────────────────────────────────────────

interface DashboardStats {
    applicants: {
        total: number;
        pending: number;
        admitted: number;
        waitlist: number;
        rejected: number;
        scoring: number;
        scored: number;
    };
    users: {
        total: number;
        active: number;
        paused: number;
        byLevel: Record<string, number>;
    };
    income: {
        pendingReviews: number;
        totalVerifiedUSD: number;
        totalRecords: number;
    };
    missions: {
        pendingReviews: number;
        completedToday: number;
        activeAssignments: number;
    };
    testimonials: {
        pending: number;
    };
    partners: {
        pending: number;
    };
}

interface RecentActivity {
    type: 'application' | 'income' | 'mission' | 'testimonial';
    description: string;
    timestamp: string;
    applicantId?: string;
    userId?: string;
}

interface CohortInfo {
    id: string;
    name: string;
    currentDay: number;
    currentPhase: string;
    startDate: string;
    isActive: boolean;
}

interface CommandStats {
    participantStats?: {
        total: number;
        active: number;
        atRisk: number;
        paused: number;
        graduated: number;
        exited: number;
    };
}

interface UpcomingGate {
    cohortId: string;
    gateType: string;
    scheduledDate: string;
    dayNumber: number;
    daysUntil: number;
}

// ─── Helpers ───────────────────────────────────────────────────────

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'application': return <FileText size={16} />;
        case 'income': return <DollarSign size={16} />;
        case 'mission': return <Target size={16} />;
        case 'testimonial': return <MessageSquareQuote size={16} />;
        default: return <FileText size={16} />;
    }
};

const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const PHASE_CONFIG: Record<string, { label: string; color: string; days: string }> = {
    PRE_COHORT: { label: 'Pre-Cohort', color: 'var(--phase-pre-cohort)', days: 'Day -28 to 0' },
    TRAINING: { label: 'Training', color: 'var(--phase-training)', days: 'Day 1-42' },
    MARKET: { label: 'Market', color: 'var(--phase-market)', days: 'Day 43-69' },
    INCOME: { label: 'Income', color: 'var(--phase-income)', days: 'Day 70-90' },
    EXIT: { label: 'Exit', color: 'var(--phase-exit)', days: 'Post Day 90' },
};

const PHASE_ORDER = ['PRE_COHORT', 'TRAINING', 'MARKET', 'INCOME', 'EXIT'];
const PHASE_WIDTHS: Record<string, number> = {
    PRE_COHORT: 15,
    TRAINING: 35,
    MARKET: 22,
    INCOME: 18,
    EXIT: 10,
};

const PIPELINE_COLORS: Record<string, string> = {
    pending: 'var(--text-muted)',
    scoring: 'var(--accent-warning)',
    scored: 'var(--gold-warm)',
    admitted: 'var(--accent-success)',
    waitlist: 'var(--navy-medium)',
    rejected: 'var(--accent-danger)',
};

const GATE_LABELS: Record<string, string> = {
    DAY_1_BASELINE: 'Day 1',
    DAY_30_SELLABLE_SKILL: 'Day 30',
    DAY_60_MARKET_CONTACT: 'Day 60',
    DAY_90_INCOME: 'Day 90',
};

const IS_DEV = process.env.NODE_ENV !== 'production';

// ─── Mock Data (Dev Only) ──────────────────────────────────────────

const MOCK_STATS: DashboardStats = {
    applicants: { total: 47, pending: 8, admitted: 22, waitlist: 5, rejected: 3, scoring: 4, scored: 5 },
    users: { total: 34, active: 28, paused: 3, byLevel: { IDENTITY_1: 12, IDENTITY_2: 9, IDENTITY_3: 5, IDENTITY_4: 2 } },
    income: { pendingReviews: 6, totalVerifiedUSD: 1_285_000, totalRecords: 42 },
    missions: { pendingReviews: 3, completedToday: 14, activeAssignments: 31 },
    testimonials: { pending: 2 },
    partners: { pending: 1 },
};

const MOCK_ACTIVITY: RecentActivity[] = [
    { type: 'application', description: 'New application from Adaeze Okafor', timestamp: new Date(Date.now() - 12 * 60000).toISOString() },
    { type: 'income', description: 'Income report submitted by Chidi Eze — ₦45,000', timestamp: new Date(Date.now() - 38 * 60000).toISOString() },
    { type: 'mission', description: 'Mission "Build Portfolio Site" completed by Amina Bello', timestamp: new Date(Date.now() - 2 * 3600000).toISOString() },
    { type: 'testimonial', description: 'New testimonial from Favour Okonkwo', timestamp: new Date(Date.now() - 4 * 3600000).toISOString() },
    { type: 'application', description: 'Application scored for Tunde Bakare — 78%', timestamp: new Date(Date.now() - 6 * 3600000).toISOString() },
    { type: 'income', description: 'Income verified for Ngozi Adeyemi — ₦120,000', timestamp: new Date(Date.now() - 8 * 3600000).toISOString() },
    { type: 'mission', description: 'Mission review pending: "First Client Pitch" by Emeka Obi', timestamp: new Date(Date.now() - 24 * 3600000).toISOString() },
];

const MOCK_COHORT: CohortInfo = {
    id: 'mock-cohort-1', name: 'Cohort 3:10 — Lagos', currentDay: 38, currentPhase: 'TRAINING',
    startDate: new Date(Date.now() - 38 * 86400000).toISOString(), isActive: true,
};

const MOCK_COMMAND_STATS: CommandStats = {
    participantStats: { total: 34, active: 28, atRisk: 4, paused: 3, graduated: 0, exited: 1 },
};

const MOCK_GATES: UpcomingGate[] = [
    { cohortId: 'mock-cohort-1', gateType: 'DAY_30_SELLABLE_SKILL', scheduledDate: new Date(Date.now() - 8 * 86400000).toISOString(), dayNumber: 30, daysUntil: 0 },
    { cohortId: 'mock-cohort-1', gateType: 'DAY_60_MARKET_CONTACT', scheduledDate: new Date(Date.now() + 22 * 86400000).toISOString(), dayNumber: 60, daysUntil: 22 },
];

// ─── Component ─────────────────────────────────────────────────────

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<RecentActivity[]>([]);
    const [cohort, setCohort] = useState<CohortInfo | null>(null);
    const [commandStats, setCommandStats] = useState<CommandStats | null>(null);
    const [upcomingGates, setUpcomingGates] = useState<UpcomingGate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const token = localStorage.getItem('auth_token');
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const [statsRes, activityRes, cohortRes, commandRes] = await Promise.all([
                    fetch(`${API_BASE}/admin/dashboard`, { headers }).catch(() => null),
                    fetch(`${API_BASE}/admin/activity?limit=10`, { headers }).catch(() => null),
                    fetch(`${API_BASE}/settings/cohorts`, { headers }).catch(() => null),
                    fetch(`${API_BASE}/admin/command-centre/dashboard/executive`, { headers }).catch(() => null),
                ]);

                // Stats
                if (statsRes?.ok) {
                    setStats(await statsRes.json());
                } else if (IS_DEV) {
                    console.warn('[DEV] Using mock dashboard stats');
                    setStats(MOCK_STATS);
                }

                // Activity
                if (activityRes?.ok) {
                    setActivity(await activityRes.json());
                } else if (IS_DEV) {
                    console.warn('[DEV] Using mock activity feed');
                    setActivity(MOCK_ACTIVITY);
                }

                // Cohort for timeline
                let cohortLoaded = false;
                if (cohortRes?.ok) {
                    try {
                        const cohorts = await cohortRes.json();
                        const activeCohort = Array.isArray(cohorts)
                            ? cohorts.find((c: CohortInfo) => c.isActive)
                            : null;
                        if (activeCohort) {
                            setCohort(activeCohort);
                            cohortLoaded = true;
                            try {
                                const gatesRes = await fetch(
                                    `${API_BASE}/admin/command-centre/dashboard/operations`,
                                    { headers }
                                );
                                if (gatesRes.ok) {
                                    const opsData = await gatesRes.json();
                                    setUpcomingGates(opsData.upcomingGates || []);
                                } else if (IS_DEV) {
                                    setUpcomingGates(MOCK_GATES);
                                }
                            } catch {
                                if (IS_DEV) setUpcomingGates(MOCK_GATES);
                            }
                        }
                    } catch {
                        // JSON parse error — fall through
                    }
                }
                if (!cohortLoaded && IS_DEV) {
                    console.warn('[DEV] Using mock cohort data');
                    setCohort(MOCK_COHORT);
                    setUpcomingGates(MOCK_GATES);
                }

                // Command centre
                let commandLoaded = false;
                if (commandRes?.ok) {
                    try {
                        const cmdData = await commandRes.json();
                        if (cmdData?.participantStats) {
                            setCommandStats(cmdData);
                            commandLoaded = true;
                        }
                    } catch {
                        // JSON parse error — fall through
                    }
                }
                if (!commandLoaded && IS_DEV) {
                    console.warn('[DEV] Using mock command centre stats');
                    setCommandStats(MOCK_COMMAND_STATS);
                }

                // In production, if no stats loaded, show error
                if (!statsRes?.ok && !IS_DEV) {
                    setError('Failed to load dashboard data');
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                if (IS_DEV) {
                    console.warn('[DEV] Falling back to full mock data');
                    setStats(MOCK_STATS);
                    setActivity(MOCK_ACTIVITY);
                    setCohort(MOCK_COHORT);
                    setCommandStats(MOCK_COMMAND_STATS);
                    setUpcomingGates(MOCK_GATES);
                } else {
                    setError('Failed to load dashboard data');
                }
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    // ─── Derived ───────────────────────────────────────────────────

    const totalPending =
        (stats?.applicants.scored || 0) +
        (stats?.income.pendingReviews || 0) +
        (stats?.missions.pendingReviews || 0) +
        (stats?.testimonials?.pending || 0) +
        (stats?.partners?.pending || 0);

    const pStats = commandStats?.participantStats;
    const nextGate = upcomingGates.length > 0 ? upcomingGates[0] : null;

    // ─── Render ────────────────────────────────────────────────────

    if (loading) {
        return (
            <div>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div>
                <div className={styles.errorState}>
                    <AlertCircle size={32} />
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>

            {/* ── 2. Cohort Timeline ── */}
            {cohort && (
                <div className={styles.cohortTimeline}>
                    <div className={styles.timelineHeader}>
                        <div className={styles.timelineTitle}>
                            <CalendarDays size={16} />
                            <span>{cohort.name || 'Active Cohort'}</span>
                        </div>
                        <span className={styles.timelineDayBadge}>
                            Day {cohort.currentDay || 0} of 90
                        </span>
                    </div>

                    {/* Gate labels above track */}
                    <div className={styles.gateMarkers}>
                        <span className={styles.gateLabel}>Start</span>
                        <span className={styles.gateLabel}>Day 30</span>
                        <span className={styles.gateLabel}>Day 60</span>
                        <span className={styles.gateLabel}>Day 90</span>
                    </div>

                    {/* Phase segments */}
                    <div className={styles.timelineTrack}>
                        {PHASE_ORDER.filter(p => p !== 'PRE_COHORT' && p !== 'EXIT').map(phase => {
                            const config = PHASE_CONFIG[phase];
                            const currentIdx = PHASE_ORDER.indexOf(cohort.currentPhase || 'TRAINING');
                            const phaseIdx = PHASE_ORDER.indexOf(phase);
                            let status = 'inactive';
                            if (phaseIdx < currentIdx) status = 'past';
                            if (phaseIdx === currentIdx) status = 'current';

                            return (
                                <div
                                    key={phase}
                                    className={`${styles.timelinePhase} ${styles[status]}`}
                                    style={{
                                        width: `${PHASE_WIDTHS[phase] / 0.75}%`,
                                        backgroundColor: config.color,
                                    }}
                                >
                                    {config.label}
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className={styles.timelineLegend}>
                        {PHASE_ORDER.filter(p => p !== 'PRE_COHORT' && p !== 'EXIT').map(phase => (
                            <div key={phase} className={styles.legendItem}>
                                <span
                                    className={styles.legendDot}
                                    style={{ backgroundColor: PHASE_CONFIG[phase].color }}
                                />
                                <span>{PHASE_CONFIG[phase].label} ({PHASE_CONFIG[phase].days})</span>
                            </div>
                        ))}
                        {nextGate && (
                            <div className={styles.legendItem}>
                                <span className={styles.legendDot} style={{ backgroundColor: 'var(--accent-warning)' }} />
                                <span>Next Gate: {GATE_LABELS[nextGate.gateType] || nextGate.gateType} in {nextGate.daysUntil}d</span>
                            </div>
                        )}
                    </div>
                </div>
            )}



            {/* ── 4. Stat Cards ── */}
            <div className={styles.statsGrid}>
                <StatCard
                    icon={<FileText size={16} />}
                    label="Applicants"
                    value={stats?.applicants.total || 0}
                    badges={[
                        ...((stats?.applicants.pending || 0) > 0 ? [{ text: `${stats?.applicants.pending} pending`, variant: 'warning' as const }] : []),
                        { text: `${stats?.applicants.admitted || 0} admitted`, variant: 'success' as const },
                    ]}
                    onClick={() => router.push('/admin/applicants')}
                />
                <StatCard
                    icon={<ClipboardCheck size={16} />}
                    label="Awaiting Decision"
                    value={stats?.applicants.scored || 0}
                    badges={(stats?.applicants.scoring || 0) > 0 ? [{ text: `${stats?.applicants.scoring} scoring`, variant: 'gold' as const }] : undefined}
                    onClick={() => router.push('/admin/applicants?status=SCORED')}
                />
                <StatCard
                    icon={<Users size={16} />}
                    label="Participants"
                    value={stats?.users.active || 0}
                    badges={[
                        ...((stats?.users.paused || 0) > 0 ? [{ text: `${stats?.users.paused} paused`, variant: 'gold' as const }] : []),
                        { text: `${stats?.users.total || 0} total`, variant: 'success' as const },
                    ]}
                    onClick={() => router.push('/admin/participants')}
                />
                <StatCard
                    icon={<DollarSign size={16} />}
                    label="Verified Income"
                    value={`₦${(stats?.income.totalVerifiedUSD || 0).toLocaleString()}`}
                    badges={(stats?.income.pendingReviews || 0) > 0 ? [{ text: `${stats?.income.pendingReviews} pending`, variant: 'warning' as const }] : undefined}
                    onClick={() => router.push('/admin/income')}
                />
                <StatCard
                    icon={<Target size={16} />}
                    label="Missions Today"
                    value={stats?.missions.completedToday || 0}
                    badges={[{ text: `${stats?.missions.activeAssignments || 0} active`, variant: 'gold' as const }]}
                    onClick={() => router.push('/admin/missions')}
                />
                <StatCard
                    icon={<Handshake size={16} />}
                    label="Engagement"
                    value={(stats?.testimonials?.pending || 0) + (stats?.partners?.pending || 0)}
                    badges={[
                        ...((stats?.testimonials?.pending || 0) > 0 ? [{ text: `${stats?.testimonials?.pending} testimonials`, variant: 'warning' as const }] : []),
                        ...((stats?.partners?.pending || 0) > 0 ? [{ text: `${stats?.partners?.pending} partners`, variant: 'gold' as const }] : []),
                    ]}
                    onClick={() => router.push('/admin/testimonials')}
                />
            </div>



            {/* ── 6. Command Centre Summary ── */}
            {pStats && pStats.total > 0 && (
                <div className={styles.commandSummary}>
                    <div className={styles.commandHeader}>
                        <div className={styles.commandTitle}>
                            <Shield size={16} />
                            <span>Command Centre</span>
                        </div>
                        <div
                            className={styles.commandLink}
                            onClick={() => router.push('/admin/command-centre')}
                        >
                            View Centre <ChevronRight size={14} />
                        </div>
                    </div>
                    <div className={styles.commandGrid}>
                        <div className={styles.commandStatItem}>
                            <span className={styles.commandStatDot} style={{ backgroundColor: 'var(--accent-success)' }} />
                            <span className={styles.commandStatLabel}>Active</span>
                            <span className={styles.commandStatValue}>{pStats.active}</span>
                        </div>
                        <div className={styles.commandStatItem}>
                            <span className={styles.commandStatDot} style={{ backgroundColor: 'var(--accent-warning)' }} />
                            <span className={styles.commandStatLabel}>At Risk</span>
                            <span className={styles.commandStatValue}>{pStats.atRisk}</span>
                        </div>
                        <div className={styles.commandStatItem}>
                            <span className={styles.commandStatDot} style={{ backgroundColor: 'var(--gold-warm)' }} />
                            <span className={styles.commandStatLabel}>Paused</span>
                            <span className={styles.commandStatValue}>{pStats.paused}</span>
                        </div>
                        <div className={styles.commandStatItem}>
                            <span className={styles.commandStatDot} style={{ backgroundColor: 'var(--navy-medium)' }} />
                            <span className={styles.commandStatLabel}>Graduated</span>
                            <span className={styles.commandStatValue}>{pStats.graduated}</span>
                        </div>
                    </div>
                    {nextGate && (
                        <div className={styles.nextGate}>
                            <span className={styles.nextGateLabel}>
                                Next Gate: {GATE_LABELS[nextGate.gateType] || nextGate.gateType}
                            </span>
                            <span className={styles.nextGateValue}>
                                {nextGate.daysUntil === 0 ? '🔴 TODAY' : `In ${nextGate.daysUntil} day${nextGate.daysUntil > 1 ? 's' : ''}`}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── 7 & 8. Activity + Quick Actions ── */}
            <div className={styles.panels}>
                <div className={`card ${styles.activityPanel}`}>
                    <h2>Recent Activity</h2>
                    {activity.length === 0 ? (
                        <div className={styles.emptyActivity}>
                            <p>No recent activity</p>
                        </div>
                    ) : (
                        <div className={styles.activityList}>
                            {activity.map((item, idx) => (
                                <div key={idx} className={styles.activityItem}>
                                    <span className={styles.activityIcon}>
                                        {getActivityIcon(item.type)}
                                    </span>
                                    <div className={styles.activityContent}>
                                        <span>{item.description}</span>
                                        <span className={styles.activityTime}>{formatTimeAgo(item.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`card ${styles.quickActions}`}>
                    <h2>Quick Actions</h2>
                    <div className={styles.actionButtons}>
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push('/admin/applicants?status=SCORED')}
                            disabled={(stats?.applicants.scored || 0) === 0}
                        >
                            <ClipboardCheck size={16} /> Review Scored ({stats?.applicants.scored || 0})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/applicants?status=PENDING')}
                            disabled={(stats?.applicants.pending || 0) === 0}
                        >
                            <FileText size={16} /> Review Applicants ({stats?.applicants.pending || 0})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/income')}
                            disabled={(stats?.income.pendingReviews || 0) === 0}
                        >
                            <DollarSign size={16} /> Approve Income ({stats?.income.pendingReviews || 0})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/missions/reviews')}
                            disabled={(stats?.missions.pendingReviews || 0) === 0}
                        >
                            <Target size={16} /> Review Missions ({stats?.missions.pendingReviews || 0})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/testimonials')}
                            disabled={(stats?.testimonials?.pending || 0) === 0}
                        >
                            <MessageSquareQuote size={16} /> Testimonials ({stats?.testimonials?.pending || 0})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
