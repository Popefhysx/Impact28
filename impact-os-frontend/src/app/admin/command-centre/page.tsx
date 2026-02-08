'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield, AlertTriangle, Clock, ChevronRight, Loader2,
    Target, TrendingDown, CheckCircle, XCircle, Pause,
    Users, Activity, ArrowRight, Timer, BarChart3, Zap
} from 'lucide-react';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
interface GraduationStats {
    total: number;
    active: number;
    atRisk: number;
    paused: number;
    graduated: number;
    exited: number;
}

interface UpcomingGate {
    cohortId: string;
    gateType: string;
    scheduledDate: string;
    dayNumber: number;
    daysUntil: number;
}

interface PausedParticipant {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    pausedAt: string;
    pauseReason: string;
}

interface AtRiskParticipant {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface Cohort {
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    currentDay?: number;
    currentPhase?: string;
    _count?: { users: number };
}

// ============================================================================
// CONSTANTS
// ============================================================================
const gateLabels: Record<string, { label: string; color: string; desc: string }> = {
    'DAY_1_BASELINE': { label: 'Day 1 Baseline', color: 'var(--navy-medium)', desc: 'Orientation + Consent' },
    'DAY_30_SELLABLE_SKILL': { label: 'Day 30 Skill Gate', color: 'var(--gold-warm)', desc: 'Mission completion + Skill score' },
    'DAY_60_MARKET_CONTACT': { label: 'Day 60 Market Gate', color: '#E67E22', desc: 'Outreach evidence + Market activity' },
    'DAY_90_INCOME': { label: 'Day 90 Income Gate', color: 'var(--accent-success)', desc: 'Verified income + All journals' },
};

const stateColors: Record<string, string> = {
    active: 'var(--accent-success)',
    atRisk: 'var(--gold-warm)',
    paused: 'var(--navy-medium)',
    graduated: '#8E44AD',
    exited: 'var(--accent-danger)',
};

const phaseLabels: Record<string, { label: string; color: string }> = {
    'PRE_COHORT': { label: 'Pre-Cohort', color: 'var(--text-secondary)' },
    'TRAINING': { label: 'Training', color: 'var(--navy-medium)' },
    'MARKET': { label: 'Market Exposure', color: 'var(--gold-warm)' },
    'INCOME': { label: 'Income Verification', color: 'var(--accent-success)' },
    'EXIT': { label: 'Post-Program', color: 'var(--text-secondary)' },
};

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
}

function formatTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// ============================================================================
// DEV-ONLY MOCK DATA
// ============================================================================
const mockStats: GraduationStats = { total: 42, active: 28, atRisk: 6, paused: 4, graduated: 2, exited: 2 };
const mockUpcomingGates: UpcomingGate[] = [
    { cohortId: 'c1', gateType: 'DAY_30_SELLABLE_SKILL', scheduledDate: new Date(Date.now() + 4 * 86400000).toISOString(), dayNumber: 30, daysUntil: 4 },
    { cohortId: 'c1', gateType: 'DAY_60_MARKET_CONTACT', scheduledDate: new Date(Date.now() + 34 * 86400000).toISOString(), dayNumber: 60, daysUntil: 34 },
];
const mockAtRisk: AtRiskParticipant[] = [
    { id: 'u1', firstName: 'Adaeze', lastName: 'Okonkwo', email: 'adaeze.o@email.com' },
    { id: 'u2', firstName: 'Chidi', lastName: 'Eze', email: 'chidi.e@email.com' },
    { id: 'u3', firstName: 'Funke', lastName: 'Adeyemi', email: 'funke.a@email.com' },
    { id: 'u5', firstName: 'Chidinma', lastName: 'Okafo', email: 'chidinma.o@email.com' },
    { id: 'u6', firstName: 'Nneka', lastName: 'Ajayi', email: 'nneka.a@email.com' },
];
const mockPaused: PausedParticipant[] = [
    { id: 'u7', firstName: 'Emeka', lastName: 'Nnamdi', email: 'emeka.n@email.com', pausedAt: new Date(Date.now() - 3 * 86400000).toISOString(), pauseReason: 'Low momentum (below 30 for 5+ days)' },
    { id: 'u8', firstName: 'Oluwaseun', lastName: 'Bakare', email: 'seun.b@email.com', pausedAt: new Date(Date.now() - 7 * 86400000).toISOString(), pauseReason: 'Unresolved gate failure' },
    { id: 'u9', firstName: 'Blessing', lastName: 'Obi', email: 'blessing.o@email.com', pausedAt: new Date(Date.now() - 10 * 86400000).toISOString(), pauseReason: 'No activity for 14+ days' },
    { id: 'u10', firstName: 'Amaka', lastName: 'Eze', email: 'amaka.e@email.com', pausedAt: new Date(Date.now() - 14 * 86400000).toISOString(), pauseReason: 'Self-requested pause' },
];
const mockCohort: Cohort = {
    id: 'c1', name: 'Project 3:10', startDate: new Date(Date.now() - 26 * 86400000).toISOString(),
    isActive: true, currentDay: 26, currentPhase: 'TRAINING', _count: { users: 42 },
};
const IS_DEV = process.env.NODE_ENV !== 'production';

// ============================================================================
// COMPONENT
// ============================================================================
export default function CommandCentrePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // --- Operational state ---
    const [stats, setStats] = useState<GraduationStats | null>(null);
    const [upcomingGates, setUpcomingGates] = useState<UpcomingGate[]>([]);
    const [pausedParticipants, setPausedParticipants] = useState<PausedParticipant[]>([]);
    const [atRiskParticipants, setAtRiskParticipants] = useState<AtRiskParticipant[]>([]);
    const [activeCohort, setActiveCohort] = useState<Cohort | null>(null);

    // ========================================================================
    // FETCH — All Operational Data
    // ========================================================================
    useEffect(() => {
        async function fetchData() {
            try {
                const token = localStorage.getItem('auth_token');
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

                // Fetch operations + executive data in parallel
                const [opsRes, statsRes, cohortsRes] = await Promise.all([
                    fetch(`${API_BASE}/admin/command-centre/dashboard/operations`, { headers }),
                    fetch(`${API_BASE}/admin/command-centre/dashboard/executive`, { headers }),
                    fetch(`${API_BASE}/settings/cohorts`, { headers }),
                ]);

                if (opsRes.ok) {
                    const data = await opsRes.json();
                    setUpcomingGates(data.upcomingGates?.length > 0 ? data.upcomingGates : IS_DEV ? mockUpcomingGates : []);
                    setPausedParticipants(data.pausedParticipants?.length > 0 ? data.pausedParticipants : IS_DEV ? mockPaused : []);
                    setAtRiskParticipants(data.atRiskParticipants?.length > 0 ? data.atRiskParticipants : IS_DEV ? mockAtRisk : []);
                } else if (IS_DEV) {
                    setUpcomingGates(mockUpcomingGates);
                    setPausedParticipants(mockPaused);
                    setAtRiskParticipants(mockAtRisk);
                }

                if (statsRes.ok) {
                    const sd = await statsRes.json();
                    setStats(sd.participantStats?.total > 0 ? sd.participantStats : IS_DEV ? mockStats : null);
                } else if (IS_DEV) {
                    setStats(mockStats);
                }

                if (cohortsRes.ok) {
                    const cohorts: Cohort[] = await cohortsRes.json();
                    const active = cohorts.find(c => c.isActive);
                    setActiveCohort(active || (IS_DEV ? mockCohort : null));
                } else if (IS_DEV) {
                    setActiveCohort(mockCohort);
                }
            } catch {
                if (IS_DEV) {
                    setStats(mockStats);
                    setUpcomingGates(mockUpcomingGates);
                    setPausedParticipants(mockPaused);
                    setAtRiskParticipants(mockAtRisk);
                    setActiveCohort(mockCohort);
                }
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================
    const totalParticipants = stats ? stats.active + stats.atRisk + stats.paused + stats.graduated + stats.exited : 0;
    const getPercentage = (val: number) => totalParticipants > 0 ? ((val / totalParticipants) * 100).toFixed(1) : '0';
    const daysRemaining = activeCohort?.currentDay ? Math.max(0, 90 - activeCohort.currentDay) : 0;
    const currentWeek = activeCohort?.currentDay ? Math.ceil(activeCohort.currentDay / 7) : 0;

    // Conversion funnel values
    const admitted = stats?.total || 0;
    const activated = stats ? stats.active + stats.atRisk + stats.paused + stats.graduated : 0;
    const marketExposed = stats ? stats.active + stats.graduated : 0;
    const firstIncome = stats?.graduated || 0;
    const verifiedEarners = stats?.graduated || 0;

    const interventionCount = atRiskParticipants.length + pausedParticipants.length;

    // ========================================================================
    // LOADING STATE
    // ========================================================================
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Initializing Command Centre...</p>
                </div>
            </div>
        );
    }

    // ========================================================================
    // RENDER — Single-Screen Control Plane
    // ========================================================================
    return (
        <div className={styles.container}>
            {/* ── A. COHORT STATUS SNAPSHOT (Always Visible Top Bar) ────── */}
            <div className={styles.statusBar}>
                <div className={styles.statusBarMain}>
                    <div className={styles.cohortIdentity}>
                        <Shield size={18} className={styles.shieldIcon} />
                        <div>
                            <span className={styles.cohortName}>{activeCohort?.name || 'No Active Cohort'}</span>
                            {activeCohort && (
                                <span className={styles.cohortMeta}>
                                    Week {currentWeek} • Day {activeCohort.currentDay} of 90
                                </span>
                            )}
                        </div>
                    </div>
                    {activeCohort?.currentPhase && (
                        <div className={styles.phaseIndicator}>
                            <span
                                className={styles.phaseBadge}
                                style={{ color: phaseLabels[activeCohort.currentPhase]?.color }}
                            >
                                {phaseLabels[activeCohort.currentPhase]?.label || activeCohort.currentPhase}
                            </span>
                            <span className={styles.daysRemaining}>
                                <Timer size={14} />
                                {daysRemaining} days remaining
                            </span>
                        </div>
                    )}
                </div>

                {/* State Distribution Bar */}
                {stats && (
                    <div className={styles.stateDistribution}>
                        <div className={styles.stateBarTrack}>
                            {stats.active > 0 && <div className={styles.stateSegment} style={{ width: `${getPercentage(stats.active)}%`, backgroundColor: stateColors.active }} title={`Active: ${stats.active}`} />}
                            {stats.atRisk > 0 && <div className={styles.stateSegment} style={{ width: `${getPercentage(stats.atRisk)}%`, backgroundColor: stateColors.atRisk }} title={`At Risk: ${stats.atRisk}`} />}
                            {stats.paused > 0 && <div className={styles.stateSegment} style={{ width: `${getPercentage(stats.paused)}%`, backgroundColor: stateColors.paused }} title={`Paused: ${stats.paused}`} />}
                            {stats.graduated > 0 && <div className={styles.stateSegment} style={{ width: `${getPercentage(stats.graduated)}%`, backgroundColor: stateColors.graduated }} title={`Graduated: ${stats.graduated}`} />}
                            {stats.exited > 0 && <div className={styles.stateSegment} style={{ width: `${getPercentage(stats.exited)}%`, backgroundColor: stateColors.exited }} title={`Exited: ${stats.exited}`} />}
                        </div>
                        <div className={styles.stateBarLegend}>
                            {Object.entries({ active: stats.active, atRisk: stats.atRisk, paused: stats.paused, graduated: stats.graduated, exited: stats.exited }).map(([k, v]) => (
                                <div key={k} className={styles.legendItem}>
                                    <span className={styles.legendDot} style={{ backgroundColor: stateColors[k] }} />
                                    <span>{k === 'atRisk' ? 'At Risk' : k.charAt(0).toUpperCase() + k.slice(1)} ({v})</span>
                                </div>
                            ))}
                            <span className={styles.totalBadge}>{totalParticipants} total</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── DOCTRINE ─────────────────────────────────────────── */}
            <div className={styles.doctrine}>
                <em>&ldquo;Time, Standards &amp; Truth — not effort or sympathy.&rdquo;</em>
            </div>

            {/* ── MAIN GRID: 4-Panel Layout ──────────────────────── */}
            <div className={styles.controlGrid}>

                {/* ── B. CONVERSION FUNNEL (Truth View) ──────────── */}
                <section className={`card ${styles.panel} ${styles.funnelPanel}`}>
                    <div className={styles.panelHeader}>
                        <h3><BarChart3 size={16} /> Conversion Funnel</h3>
                        <span className={styles.panelHint}>Is the system converting?</span>
                    </div>
                    <div className={styles.funnel}>
                        {[
                            { label: 'Admitted', count: admitted, icon: <Users size={16} />, color: 'var(--navy-medium)' },
                            { label: 'Activated', count: activated, icon: <Zap size={16} />, color: 'var(--navy-deep)' },
                            { label: 'Market Exposed', count: marketExposed, icon: <Target size={16} />, color: 'var(--gold-warm)' },
                            { label: 'First Income', count: firstIncome, icon: <Activity size={16} />, color: '#E67E22' },
                            { label: 'Verified Earners', count: verifiedEarners, icon: <CheckCircle size={16} />, color: 'var(--accent-success)' },
                        ].map((step, i, arr) => {
                            const dropoff = i > 0 && arr[i - 1].count > 0
                                ? ((1 - step.count / arr[i - 1].count) * 100).toFixed(0)
                                : null;
                            return (
                                <div key={step.label} className={styles.funnelStep}>
                                    <div className={styles.funnelBar} style={{ backgroundColor: step.color, width: `${admitted > 0 ? Math.max(20, (step.count / admitted) * 100) : 20}%` }}>
                                        <span className={styles.funnelIcon}>{step.icon}</span>
                                        <span className={styles.funnelCount}>{step.count}</span>
                                    </div>
                                    <div className={styles.funnelMeta}>
                                        <span className={styles.funnelLabel}>{step.label}</span>
                                        {dropoff && dropoff !== '0' && (
                                            <span className={styles.funnelDropoff}>
                                                <TrendingDown size={12} /> {dropoff}% drop
                                            </span>
                                        )}
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div className={styles.funnelArrow}><ArrowRight size={14} /></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ── C. RISK & INTERVENTION QUEUE ────────────────── */}
                <section className={`card ${styles.panel} ${styles.riskPanel}`}>
                    <div className={styles.panelHeader}>
                        <h3>
                            <AlertTriangle size={16} />
                            Intervention Queue
                            {interventionCount > 0 && (
                                <span className={styles.urgentBadge}>{interventionCount}</span>
                            )}
                        </h3>
                        <span className={styles.panelHint}>Exceptions only</span>
                    </div>

                    {interventionCount === 0 ? (
                        <div className={styles.emptyState}>
                            <CheckCircle size={24} />
                            <p>No interventions required</p>
                            <span>All participants within expected parameters</span>
                        </div>
                    ) : (
                        <div className={styles.interventionList}>
                            {/* At Risk participants */}
                            {atRiskParticipants.map((p) => (
                                <div
                                    key={p.id}
                                    className={styles.interventionItem}
                                    onClick={() => router.push(`/admin/participants/${p.id}`)}
                                >
                                    <div className={styles.avatar}>
                                        {`${p.firstName.charAt(0)}${p.lastName.charAt(0)}`}
                                    </div>
                                    <div className={styles.interventionInfo}>
                                        <span className={styles.interventionName}>{p.firstName} {p.lastName}</span>
                                        <span className={styles.interventionReason}>Approaching critical threshold</span>
                                    </div>
                                    <div className={styles.interventionMeta}>
                                        <span className={styles.stateBadge} style={{ color: stateColors.atRisk, borderColor: stateColors.atRisk }}>
                                            <AlertTriangle size={12} /> At Risk
                                        </span>
                                    </div>
                                    <ChevronRight size={14} className={styles.chevron} />
                                </div>
                            ))}

                            {/* Paused participants */}
                            {pausedParticipants.map((p) => (
                                <div
                                    key={p.id}
                                    className={styles.interventionItem}
                                    onClick={() => router.push(`/admin/participants/${p.id}`)}
                                >
                                    <div className={styles.avatar}>
                                        {`${p.firstName.charAt(0)}${p.lastName.charAt(0)}`}
                                    </div>
                                    <div className={styles.interventionInfo}>
                                        <span className={styles.interventionName}>{p.firstName} {p.lastName}</span>
                                        <span className={styles.interventionReason}>{p.pauseReason}</span>
                                    </div>
                                    <div className={styles.interventionMeta}>
                                        <span className={styles.stateBadge} style={{ color: stateColors.paused, borderColor: stateColors.paused }}>
                                            <Pause size={12} /> Paused
                                        </span>
                                        <span className={styles.timeInState}>
                                            <Clock size={11} /> {formatTimeAgo(p.pausedAt)}
                                        </span>
                                    </div>
                                    <ChevronRight size={14} className={styles.chevron} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── D. ENFORCEMENT INTEGRITY ────────────────────── */}
                <section className={`card ${styles.panel} ${styles.enforcementPanel}`}>
                    <div className={styles.panelHeader}>
                        <h3><Shield size={16} /> Enforcement Integrity</h3>
                        <span className={styles.panelHint}>Are we being fair and consistent?</span>
                    </div>

                    <div className={styles.enforcementGrid}>
                        {/* Gate Schedule */}
                        <div className={styles.enforcementSection}>
                            <h4><Target size={14} /> Gate Schedule</h4>
                            <div className={styles.gateTimeline}>
                                {[
                                    { type: 'DAY_1_BASELINE', day: 1 },
                                    { type: 'DAY_30_SELLABLE_SKILL', day: 30 },
                                    { type: 'DAY_60_MARKET_CONTACT', day: 60 },
                                    { type: 'DAY_90_INCOME', day: 90 },
                                ].map((gate) => {
                                    const scheduled = upcomingGates.find(g => g.gateType === gate.type);
                                    const isPast = activeCohort?.currentDay ? activeCohort.currentDay > gate.day : false;
                                    const isActive = scheduled && scheduled.daysUntil <= 7;

                                    return (
                                        <div key={gate.type} className={`${styles.gateItem} ${isPast ? styles.gatePast : ''} ${isActive ? styles.gateActive : ''}`}>
                                            <div className={styles.gateDot} style={{ backgroundColor: gateLabels[gate.type]?.color }}>
                                                {isPast ? <CheckCircle size={12} /> : isActive ? <AlertTriangle size={12} /> : null}
                                            </div>
                                            <div className={styles.gateInfo}>
                                                <span className={styles.gateLabel}>{gateLabels[gate.type]?.label}</span>
                                                <span className={styles.gateDesc}>{gateLabels[gate.type]?.desc}</span>
                                            </div>
                                            <div className={styles.gateTiming}>
                                                {isPast ? (
                                                    <span className={styles.gateComplete}>✓ Complete</span>
                                                ) : scheduled ? (
                                                    <span className={styles.gateDaysUntil}>
                                                        {scheduled.daysUntil === 0 ? '🔴 Today' : `In ${scheduled.daysUntil}d`}
                                                    </span>
                                                ) : (
                                                    <span className={styles.gateDay}>Day {gate.day}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* System Actions */}
                        <div className={styles.enforcementSection}>
                            <h4><Activity size={14} /> System Actions</h4>
                            <div className={styles.enforcementStats}>
                                <div className={styles.enforcementStat}>
                                    <span className={styles.enforcementStatValue} style={{ color: stateColors.paused }}>
                                        {stats?.paused || 0}
                                    </span>
                                    <span className={styles.enforcementStatLabel}>Auto-Paused</span>
                                </div>
                                <div className={styles.enforcementStat}>
                                    <span className={styles.enforcementStatValue} style={{ color: stateColors.atRisk }}>
                                        {stats?.atRisk || 0}
                                    </span>
                                    <span className={styles.enforcementStatLabel}>Flagged At Risk</span>
                                </div>
                                <div className={styles.enforcementStat}>
                                    <span className={styles.enforcementStatValue} style={{ color: stateColors.graduated }}>
                                        {stats?.graduated || 0}
                                    </span>
                                    <span className={styles.enforcementStatLabel}>Graduated</span>
                                </div>
                                <div className={styles.enforcementStat}>
                                    <span className={styles.enforcementStatValue} style={{ color: stateColors.exited }}>
                                        {stats?.exited || 0}
                                    </span>
                                    <span className={styles.enforcementStatLabel}>Exited</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
