'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, User, Zap, Star, Trophy, DollarSign,
    Calendar, Target, TrendingUp, Flame, CheckCircle,
    Clock, AlertCircle, PauseCircle, PlayCircle
} from 'lucide-react';
import styles from './page.module.css';

// Types
interface ParticipantDetail {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    whatsapp?: string;
    skillTrack: string;
    identityLevel: string;
    cohortId?: string;
    cohortName?: string;
    isActive: boolean;
    pauseReason?: string;
    createdAt: string;
    currencies: {
        momentum: number;
        skillXp: number;
        arenaPoints: number;
        incomeProof: number;
    };
    stipend: {
        eligible: boolean;
        tier: string;
        amount: number;
        reason?: string;
    };
    missions: {
        active: number;
        completed: number;
        pending: number;
    };
    triad: {
        technical: number;
        soft: number;
        commercial: number;
    };
    daysInProgram: number;
    streak: number;
    // PSN (Admin-Only)
    psn?: {
        level: 'LOW' | 'MEDIUM' | 'HIGH';
        score: number;
        confidence: number;
        primaryConstraint: 'DATA' | 'TRANSPORT' | 'TOOLS' | 'OTHER';
        generatedAt: string;
    };
}

// Mock data for fallback
const mockParticipant: ParticipantDetail = {
    id: 'user-001',
    firstName: 'Adaeze',
    lastName: 'Okonkwo',
    email: 'adaeze@email.com',
    whatsapp: '+2348012345678',
    skillTrack: 'GRAPHIC_DESIGN',
    identityLevel: 'L3_EXPOSED',
    cohortId: 'cohort-12',
    cohortName: 'Cohort 12',
    isActive: true,
    createdAt: '2024-11-15T00:00:00Z',
    currencies: {
        momentum: 82,
        skillXp: 1450,
        arenaPoints: 320,
        incomeProof: 25000,
    },
    stipend: {
        eligible: true,
        tier: 'STANDARD',
        amount: 15000,
    },
    missions: {
        active: 2,
        completed: 18,
        pending: 1,
    },
    triad: {
        technical: 45,
        soft: 30,
        commercial: 25,
    },
    daysInProgram: 45,
    streak: 7,
    psn: {
        level: 'MEDIUM',
        score: 62,
        confidence: 0.78,
        primaryConstraint: 'DATA',
        generatedAt: '2024-11-15T12:00:00Z',
    },
};

const levelConfig: Record<string, { label: string; color: string; icon: string }> = {
    'L1_ACTIVATED': { label: 'L1 Activated', color: '#6b7280', icon: '🌱' },
    'L2_SKILLED': { label: 'L2 Skilled', color: '#c4a052', icon: '⭐' },
    'L3_EXPOSED': { label: 'L3 Exposed', color: '#8b5cf6', icon: '🚀' },
    'L4_EARNER': { label: 'L4 Earner', color: '#10b981', icon: '💰' },
    'L5_CATALYST': { label: 'L5 Catalyst', color: '#ec4899', icon: '👑' },
};

const skillLabels: Record<string, string> = {
    'GRAPHIC_DESIGN': 'Graphic Design',
    'WEB_DEVELOPMENT': 'Web Development',
    'DIGITAL_MARKETING': 'Digital Marketing',
    'VIDEO_EDITING': 'Video Editing',
    'VIRTUAL_ASSISTANT': 'Virtual Assistant',
    'DATA_ENTRY': 'Data Entry',
    'UI_UX_DESIGN': 'UI/UX Design',
    'COPYWRITING': 'Copywriting',
    'SOCIAL_MEDIA': 'Social Media',
    'MUSIC_PRODUCTION': 'Music Production',
};

const psnConfig: Record<string, { label: string; color: string; bg: string }> = {
    'LOW': { label: 'Low Need', color: '#16a34a', bg: '#dcfce7' },
    'MEDIUM': { label: 'Medium Need', color: '#d97706', bg: '#fef3c7' },
    'HIGH': { label: 'High Need', color: '#dc2626', bg: '#fee2e2' },
};

const constraintLabels: Record<string, string> = {
    'DATA': 'Data / Internet',
    'TRANSPORT': 'Transport',
    'TOOLS': 'Tools / Software',
    'OTHER': 'Other',
};

export default function ParticipantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [participant, setParticipant] = useState<ParticipantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchParticipant = async () => {
            try {
                const response = await fetch(`/api/admin/participants/${params.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setParticipant(data);
                } else {
                    // Use mock data in development
                    setParticipant({ ...mockParticipant, id: params.id as string });
                }
            } catch (error) {
                console.error('Failed to fetch participant:', error);
                setParticipant({ ...mockParticipant, id: params.id as string });
            } finally {
                setLoading(false);
            }
        };

        fetchParticipant();
    }, [params.id]);

    const handlePauseUser = async () => {
        if (!participant) return;
        setActionLoading(true);
        try {
            await fetch(`/api/admin/participants/${participant.id}/pause`, { method: 'POST' });
            setParticipant({ ...participant, isActive: false });
        } catch (error) {
            console.error('Failed to pause user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReactivateUser = async () => {
        if (!participant) return;
        setActionLoading(true);
        try {
            await fetch(`/api/admin/participants/${participant.id}/reactivate`, { method: 'POST' });
            setParticipant({ ...participant, isActive: true });
        } catch (error) {
            console.error('Failed to reactivate user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading participant data...</div>
            </div>
        );
    }

    if (!participant) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Participant not found</div>
            </div>
        );
    }

    const levelInfo = levelConfig[participant.identityLevel] || levelConfig['L1_ACTIVATED'];

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <Link href="/admin/participants" className={styles.backLink}>
                    <ArrowLeft size={20} />
                    <span>Back to Participants</span>
                </Link>
            </div>

            {/* Profile Section */}
            <div className={styles.profileSection}>
                <div className={styles.profileMain}>
                    <div className={styles.avatar}>
                        <User size={32} />
                    </div>
                    <div className={styles.profileInfo}>
                        <h1>{participant.firstName} {participant.lastName}</h1>
                        <p className={styles.email}>{participant.email}</p>
                        <div className={styles.tags}>
                            <span
                                className={styles.levelBadge}
                                style={{ backgroundColor: levelInfo.color }}
                            >
                                {levelInfo.icon} {levelInfo.label}
                            </span>
                            <span className={styles.skillBadge}>
                                {skillLabels[participant.skillTrack] || participant.skillTrack}
                            </span>
                            {participant.cohortName && (
                                <span className={styles.cohortBadge}>{participant.cohortName}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.profileActions}>
                    {participant.isActive ? (
                        <button
                            className={styles.pauseButton}
                            onClick={handlePauseUser}
                            disabled={actionLoading}
                        >
                            <PauseCircle size={18} />
                            <span>Pause Account</span>
                        </button>
                    ) : (
                        <button
                            className={styles.reactivateButton}
                            onClick={handleReactivateUser}
                            disabled={actionLoading}
                        >
                            <PlayCircle size={18} />
                            <span>Reactivate</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Status Alert */}
            {!participant.isActive && (
                <div className={styles.pausedAlert}>
                    <AlertCircle size={20} />
                    <span>Account is paused{participant.pauseReason && `: ${participant.pauseReason}`}</span>
                </div>
            )}

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><Calendar size={20} /></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{participant.daysInProgram}</span>
                        <span className={styles.statLabel}>Days in Program</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><Flame size={20} /></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{participant.streak}</span>
                        <span className={styles.statLabel}>Day Streak</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><CheckCircle size={20} /></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{participant.missions.completed}</span>
                        <span className={styles.statLabel}>Completed Missions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}><Clock size={20} /></div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{participant.missions.active}</span>
                        <span className={styles.statLabel}>Active Missions</span>
                    </div>
                </div>
            </div>

            {/* Currency Cards */}
            <h2 className={styles.sectionTitle}>Currency Balance</h2>
            <div className={styles.currencyGrid}>
                <div className={styles.currencyCard}>
                    <Zap size={28} className={styles.currencyIcon} style={{ color: '#f59e0b' }} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{participant.currencies.momentum}</span>
                        <span className={styles.currencyLabel}>Momentum</span>
                    </div>
                    <div className={styles.currencyBar}>
                        <div
                            className={styles.currencyFill}
                            style={{ width: `${Math.min(participant.currencies.momentum, 100)}%`, backgroundColor: '#f59e0b' }}
                        />
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <Star size={28} className={styles.currencyIcon} style={{ color: '#c4a052' }} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{participant.currencies.skillXp.toLocaleString()}</span>
                        <span className={styles.currencyLabel}>Skill XP</span>
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <Trophy size={28} className={styles.currencyIcon} style={{ color: '#8b5cf6' }} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{participant.currencies.arenaPoints}</span>
                        <span className={styles.currencyLabel}>Arena Points</span>
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <DollarSign size={28} className={styles.currencyIcon} style={{ color: '#10b981' }} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>₦{participant.currencies.incomeProof.toLocaleString()}</span>
                        <span className={styles.currencyLabel}>Verified Income</span>
                    </div>
                </div>
            </div>

            {/* Support & Triad */}
            <div className={styles.panels}>
                {/* Support Status */}
                <div className={styles.panel}>
                    <h2 className={styles.sectionTitle}>Support Status</h2>
                    <div className={styles.stipendContent}>
                        <div className={styles.stipendStatus}>
                            {participant.stipend.eligible ? (
                                <span className={styles.eligible}>
                                    <CheckCircle size={18} /> Eligible
                                </span>
                            ) : (
                                <span className={styles.notEligible}>
                                    <AlertCircle size={18} /> Not Eligible
                                </span>
                            )}
                        </div>
                        <div className={styles.stipendDetails}>
                            <div className={styles.stipendItem}>
                                <span>Tier</span>
                                <strong>{participant.stipend.tier}</strong>
                            </div>
                            <div className={styles.stipendItem}>
                                <span>Amount</span>
                                <strong>₦{participant.stipend.amount.toLocaleString()}</strong>
                            </div>
                        </div>
                        {participant.stipend.reason && (
                            <p className={styles.stipendReason}>{participant.stipend.reason}</p>
                        )}
                    </div>
                </div>

                {/* Skills Triad */}
                <div className={styles.panel}>
                    <h2 className={styles.sectionTitle}>Skills Triad</h2>
                    <div className={styles.triadContent}>
                        <div className={styles.triadBar}>
                            <div className={styles.triadLabel}>Technical</div>
                            <div className={styles.triadTrack}>
                                <div
                                    className={styles.triadFill}
                                    style={{ width: `${participant.triad.technical}%`, backgroundColor: '#3b82f6' }}
                                />
                            </div>
                            <span className={styles.triadValue}>{participant.triad.technical}%</span>
                        </div>
                        <div className={styles.triadBar}>
                            <div className={styles.triadLabel}>Soft Skills</div>
                            <div className={styles.triadTrack}>
                                <div
                                    className={styles.triadFill}
                                    style={{ width: `${participant.triad.soft}%`, backgroundColor: '#10b981' }}
                                />
                            </div>
                            <span className={styles.triadValue}>{participant.triad.soft}%</span>
                        </div>
                        <div className={styles.triadBar}>
                            <div className={styles.triadLabel}>Commercial</div>
                            <div className={styles.triadTrack}>
                                <div
                                    className={styles.triadFill}
                                    style={{ width: `${participant.triad.commercial}%`, backgroundColor: '#c4a052' }}
                                />
                            </div>
                            <span className={styles.triadValue}>{participant.triad.commercial}%</span>
                        </div>
                    </div>
                </div>

                {/* PSN (Admin-Only) */}
                {participant.psn && (
                    <div className={styles.panel}>
                        <h2 className={styles.sectionTitle}>
                            Predicted Support Need
                            <span className={styles.adminOnlyTag}>Internal</span>
                        </h2>
                        <div className={styles.psnContent}>
                            <div
                                className={styles.psnBadge}
                                style={{
                                    color: psnConfig[participant.psn.level].color,
                                    backgroundColor: psnConfig[participant.psn.level].bg,
                                }}
                            >
                                {psnConfig[participant.psn.level].label}
                            </div>
                            <div className={styles.psnDetails}>
                                <div className={styles.psnItem}>
                                    <span>Score</span>
                                    <strong>{participant.psn.score}/100</strong>
                                </div>
                                <div className={styles.psnItem}>
                                    <span>Confidence</span>
                                    <strong>{Math.round(participant.psn.confidence * 100)}%</strong>
                                </div>
                                <div className={styles.psnItem}>
                                    <span>Primary Constraint</span>
                                    <strong>{constraintLabels[participant.psn.primaryConstraint]}</strong>
                                </div>
                            </div>
                            <p className={styles.psnDisclaimer}>
                                PSN is non-binding. Support is request-based and behavior-gated.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
