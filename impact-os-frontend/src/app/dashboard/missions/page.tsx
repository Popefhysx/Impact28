'use client';

import { useState, useEffect } from 'react';
import {
    Target, Clock, Check, Star, Zap, Trophy, ChevronRight, Play, Loader2, Send, X,
    TrendingUp, Wrench, BadgeDollarSign, ThumbsDown, ThumbsUp, Users, Flame, Plus
} from 'lucide-react';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const MOCK_USER_ID = 'dev-user-123';

// ==================== TYPES ====================

// Identity Levels from governance doc
const identityLevels = [
    { level: 'L0', name: 'Applicant', description: 'Intake submitted' },
    { level: 'L1', name: 'Initiate', description: 'Onboarding completed' },
    { level: 'L2', name: 'Builder', description: 'Skill missions started' },
    { level: 'L3', name: 'Operator', description: 'Market exposure begun' },
    { level: 'L4', name: 'Earner', description: 'Income verified' },
    { level: 'L5', name: 'Catalyst', description: 'Graduation achieved' },
];

interface Mission {
    id: string;
    title: string;
    description: string;
    skillDomain: 'TECHNICAL' | 'SOFT' | 'COMMERCIAL';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    momentum: number;
    skillXp: number;
    arenaPoints: number;
    requiredLevel: string;
    isActive: boolean;
}

interface MissionAssignment {
    id: string;
    userId: string;
    missionId: string;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
    proofUrl?: string;
    proofText?: string;
    assignedAt: string;
    startedAt?: string;
    completedAt?: string;
    deadlineAt?: string;
    mission: {
        title: string;
        description: string;
        skillDomain: string;
        difficulty: string;
        momentum: number;
        skillXp: number;
        arenaPoints: number;
    };
}

interface CurrencyData {
    momentum: number;
    skillXP: number;
    arenaPoints: number;
    incomeVerified: boolean;
}

interface OutreachEntry {
    id: string;
    type: 'email' | 'dm' | 'call' | 'message';
    target: string;
    sentAt: string;
    response: 'pending' | 'no_response' | 'rejected' | 'positive';
    arenaPointsEarned: number;
}

interface Milestone {
    id: string;
    title: string;
    completedAt: string;
    type: 'mission' | 'level' | 'income';
}

// ==================== HELPERS ====================

function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
        case 'EASY': return 'badge-success';
        case 'MEDIUM': return 'badge-warning';
        case 'HARD': return 'badge-danger';
        default: return 'badge-gold';
    }
}

function getDomainIcon(domain: string) {
    switch (domain) {
        case 'TECHNICAL': return <Wrench size={16} />;
        case 'SOFT': return <Zap size={16} />;
        case 'COMMERCIAL': return <Trophy size={16} />;
        default: return <Target size={16} />;
    }
}

function formatDeadline(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diff < 0) return 'Overdue';
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Due soon';
}

function getMomentumStatus(momentum: number) {
    if (momentum >= 80) return { label: 'Strong', color: 'var(--success)' };
    if (momentum >= 50) return { label: 'Steady', color: 'var(--gold-warm)' };
    if (momentum >= 25) return { label: 'Declining', color: 'var(--warning)' };
    return { label: 'Critical', color: 'var(--error)' };
}

function getResponseIcon(response: string) {
    switch (response) {
        case 'rejected': return <ThumbsDown size={16} className={styles.rejectedIcon} />;
        case 'positive': return <ThumbsUp size={16} className={styles.positiveIcon} />;
        case 'no_response': return <Clock size={16} className={styles.pendingIcon} />;
        default: return <Clock size={16} className={styles.pendingIcon} />;
    }
}

function getResponseLabel(response: string) {
    switch (response) {
        case 'rejected': return 'Rejected';
        case 'positive': return 'Positive';
        case 'no_response': return 'No Response';
        default: return 'Pending';
    }
}

// ==================== MOCK DATA ====================

const MOCK_AVAILABLE_MISSIONS: Mission[] = [
    {
        id: 'mission-1',
        title: 'Complete Git & GitHub Fundamentals',
        description: 'Learn version control basics including commits, branches, and pull requests.',
        skillDomain: 'TECHNICAL',
        difficulty: 'EASY',
        momentum: 15,
        skillXp: 50,
        arenaPoints: 0,
        requiredLevel: 'L1',
        isActive: true,
    },
    {
        id: 'mission-2',
        title: 'Build a Personal Portfolio Website',
        description: 'Create a responsive portfolio showcasing your skills and projects.',
        skillDomain: 'TECHNICAL',
        difficulty: 'MEDIUM',
        momentum: 25,
        skillXp: 120,
        arenaPoints: 5,
        requiredLevel: 'L2',
        isActive: true,
    },
    {
        id: 'mission-3',
        title: 'Pitch Your Services (2 min)',
        description: 'Record a 2-minute elevator pitch for your freelance services.',
        skillDomain: 'SOFT',
        difficulty: 'MEDIUM',
        momentum: 20,
        skillXp: 80,
        arenaPoints: 10,
        requiredLevel: 'L2',
        isActive: true,
    },
    {
        id: 'mission-4',
        title: 'Cold Outreach to 5 Prospects',
        description: 'Send personalized cold emails to potential clients in your niche.',
        skillDomain: 'COMMERCIAL',
        difficulty: 'HARD',
        momentum: 30,
        skillXp: 50,
        arenaPoints: 25,
        requiredLevel: 'L3',
        isActive: true,
    },
];

const MOCK_MY_MISSIONS: MissionAssignment[] = [
    {
        id: 'assign-1',
        userId: MOCK_USER_ID,
        missionId: 'mission-daily',
        status: 'IN_PROGRESS',
        assignedAt: new Date(Date.now() - 86400000).toISOString(),
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        deadlineAt: new Date(Date.now() + 86400000).toISOString(),
        mission: {
            title: 'Daily Check-in Post',
            description: 'Share your daily progress on The Wall to maintain streak.',
            skillDomain: 'SOFT',
            difficulty: 'EASY',
            momentum: 5,
            skillXp: 10,
            arenaPoints: 0,
        },
    },
    {
        id: 'assign-2',
        userId: MOCK_USER_ID,
        missionId: 'mission-weekly',
        status: 'IN_PROGRESS',
        assignedAt: new Date(Date.now() - 172800000).toISOString(),
        startedAt: new Date(Date.now() - 172800000).toISOString(),
        deadlineAt: new Date(Date.now() + 432000000).toISOString(),
        mission: {
            title: 'Complete 3 Interview Preparation Sessions',
            description: 'Practice answering common interview questions with a peer.',
            skillDomain: 'SOFT',
            difficulty: 'MEDIUM',
            momentum: 20,
            skillXp: 75,
            arenaPoints: 5,
        },
    },
    {
        id: 'assign-3',
        userId: MOCK_USER_ID,
        missionId: 'mission-completed-1',
        status: 'VERIFIED',
        assignedAt: new Date(Date.now() - 604800000).toISOString(),
        startedAt: new Date(Date.now() - 604800000).toISOString(),
        completedAt: new Date(Date.now() - 259200000).toISOString(),
        mission: {
            title: 'Set Up Development Environment',
            description: 'Install Node.js, VS Code, and Git on your machine.',
            skillDomain: 'TECHNICAL',
            difficulty: 'EASY',
            momentum: 10,
            skillXp: 30,
            arenaPoints: 0,
        },
    },
    {
        id: 'assign-4',
        userId: MOCK_USER_ID,
        missionId: 'mission-completed-2',
        status: 'VERIFIED',
        assignedAt: new Date(Date.now() - 864000000).toISOString(),
        startedAt: new Date(Date.now() - 864000000).toISOString(),
        completedAt: new Date(Date.now() - 518400000).toISOString(),
        mission: {
            title: 'LinkedIn Profile Optimization',
            description: 'Update your LinkedIn with professional photo and headline.',
            skillDomain: 'COMMERCIAL',
            difficulty: 'EASY',
            momentum: 15,
            skillXp: 40,
            arenaPoints: 5,
        },
    },
];

// ==================== MAIN COMPONENT ====================

export default function MissionsPage() {
    // Tab state
    const [activeSection, setActiveSection] = useState<'progress' | 'missions' | 'arena'>('missions');
    const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');

    // Mission data
    const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
    const [myMissions, setMyMissions] = useState<MissionAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [submitModal, setSubmitModal] = useState<MissionAssignment | null>(null);
    const [proofText, setProofText] = useState('');
    const [proofUrl, setProofUrl] = useState('');

    // Progress data
    const [currentLevel, setCurrentLevel] = useState(2);
    const [currencies, setCurrencies] = useState<CurrencyData>({
        momentum: 72,
        skillXP: 1450,
        arenaPoints: 23,
        incomeVerified: false,
    });
    const [milestones, setMilestones] = useState<Milestone[]>([
        { id: '1', title: 'Completed onboarding', completedAt: '2026-01-15', type: 'level' },
        { id: '2', title: 'First skill mission completed', completedAt: '2026-01-18', type: 'mission' },
        { id: '3', title: 'Reached L2 Builder', completedAt: '2026-01-20', type: 'level' },
        { id: '4', title: 'First outreach completed', completedAt: '2026-01-22', type: 'mission' },
    ]);

    // Arena data
    const [outreachLog, setOutreachLog] = useState<OutreachEntry[]>([
        { id: '1', type: 'email', target: 'Design Agency XYZ', sentAt: '2026-01-28', response: 'rejected', arenaPointsEarned: 3 },
        { id: '2', type: 'dm', target: 'Freelance Lead via LinkedIn', sentAt: '2026-01-27', response: 'no_response', arenaPointsEarned: 2 },
        { id: '3', type: 'message', target: 'Local Business Owner', sentAt: '2026-01-26', response: 'positive', arenaPointsEarned: 5 },
        { id: '4', type: 'call', target: 'Potential Client Referral', sentAt: '2026-01-25', response: 'pending', arenaPointsEarned: 2 },
    ]);

    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchUserAndData();
    }, []);

    const fetchUserAndData = async () => {
        setLoading(true);
        try {
            // 1. Get User ID from Progress to ensure we have the real ID
            const progressRes = await fetch(`${API_URL}/api/progress`, { credentials: 'include' });
            let currentUserId = MOCK_USER_ID;

            if (progressRes.ok) {
                const progress = await progressRes.json();
                currentUserId = progress.user.id;
                setUserId(currentUserId);
            }

            // 2. Fetch Data using the ID
            const [availableRes, myMissionsRes] = await Promise.all([
                fetch(`${API_URL}/api/missions/${currentUserId}/available`, { credentials: 'include' }),
                fetch(`${API_URL}/api/missions/${currentUserId}`, { credentials: 'include' }),
            ]);

            if (availableRes.ok) {
                const data = await availableRes.json();
                setAvailableMissions(data.length > 0 ? data : MOCK_AVAILABLE_MISSIONS);
            } else {
                setAvailableMissions(MOCK_AVAILABLE_MISSIONS);
            }

            if (myMissionsRes.ok) {
                const data = await myMissionsRes.json();
                setMyMissions(data.length > 0 ? data : MOCK_MY_MISSIONS);
            } else {
                setMyMissions(MOCK_MY_MISSIONS);
            }
        } catch (error) {
            console.error('Failed to fetch missions, using mock data:', error);
            setUserId(MOCK_USER_ID);
            setAvailableMissions(MOCK_AVAILABLE_MISSIONS);
            setMyMissions(MOCK_MY_MISSIONS);
        } finally {
            setLoading(false);
        }
    };

    const handleStartMission = async (missionId: string) => {
        const targetUserId = userId || MOCK_USER_ID;
        setProcessing(missionId);
        try {
            const assignRes = await fetch(`${API_URL}/api/missions/${targetUserId}/assign/${missionId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deadlineDays: 7 }),
            });

            if (assignRes.ok) {
                const assignment = await assignRes.json();
                await fetch(`${API_URL}/api/missions/${targetUserId}/start/${assignment.id}`, {
                    method: 'POST',
                });
                fetchUserAndData();
                setActiveTab('active');
            }
        } catch (error) {
            console.error('Failed to start mission:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleSubmitMission = async () => {
        if (!submitModal) return;
        const targetUserId = userId || MOCK_USER_ID;

        setProcessing(submitModal.id);
        try {
            const response = await fetch(`${API_URL}/api/missions/${targetUserId}/submit/${submitModal.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    proofText: proofText || undefined,
                    proofUrl: proofUrl || undefined,
                }),
            });

            if (response.ok) {
                setSubmitModal(null);
                setProofText('');
                setProofUrl('');
                fetchUserAndData();
            }
        } catch (error) {
            console.error('Failed to submit mission:', error);
        } finally {
            setProcessing(null);
        }
    };

    const activeMissions = myMissions.filter(m =>
        m.status === 'IN_PROGRESS' || m.status === 'ASSIGNED'
    );
    const completedMissions = myMissions.filter(m => m.status === 'VERIFIED');
    const pendingMissions = myMissions.filter(m => m.status === 'SUBMITTED');
    const momentumStatus = getMomentumStatus(currencies.momentum);

    if (loading) {
        return (
            <div className={styles.loading}>
                <Loader2 className={styles.spinner} size={32} />
                <p>Loading missions...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div>
                    <h1>Mission Control</h1>
                    <p className={styles.subtitle}>Your progress, missions, and arena tracker</p>
                </div>
            </header>

            {/* Section Tabs */}
            <div className={styles.sectionTabs}>
                <button
                    className={`${styles.sectionTab} ${activeSection === 'progress' ? styles.active : ''}`}
                    onClick={() => setActiveSection('progress')}
                >
                    <TrendingUp size={18} />
                    Progress
                </button>
                <button
                    className={`${styles.sectionTab} ${activeSection === 'missions' ? styles.active : ''}`}
                    onClick={() => setActiveSection('missions')}
                >
                    <Target size={18} />
                    Missions
                </button>
                <button
                    className={`${styles.sectionTab} ${activeSection === 'arena' ? styles.active : ''}`}
                    onClick={() => setActiveSection('arena')}
                >
                    <Trophy size={18} />
                    Arena
                </button>
            </div>

            {/* ==================== PROGRESS SECTION ==================== */}
            {activeSection === 'progress' && (
                <div className={styles.progressSection}>
                    {/* Identity Level */}
                    <section className={styles.identitySection}>
                        <h2 className={styles.sectionTitle}>
                            <Star size={20} />
                            Identity Level
                        </h2>
                        <div className={styles.identityTrack}>
                            {identityLevels.map((level, index) => (
                                <div
                                    key={level.level}
                                    className={`${styles.identityStep} ${index < currentLevel ? styles.completed : ''} ${index === currentLevel ? styles.current : ''}`}
                                >
                                    <div className={styles.stepIndicator}>
                                        <span className={styles.levelBadge}>{level.level}</span>
                                    </div>
                                    <div className={styles.stepInfo}>
                                        <span className={styles.levelName}>{level.name}</span>
                                        <span className={styles.levelDesc}>{level.description}</span>
                                    </div>
                                    {index < identityLevels.length - 1 && (
                                        <ChevronRight size={16} className={styles.stepArrow} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Currencies */}
                    <section className={styles.currencySection}>
                        <h2 className={styles.sectionTitle}>
                            <TrendingUp size={20} />
                            Behavioral Currencies
                        </h2>
                        <div className={styles.currencyGrid}>
                            <div className={styles.currencyCard}>
                                <div className={styles.currencyHeader}>
                                    <Zap size={24} className={styles.momentumIcon} />
                                    <span className={styles.currencyName}>Momentum</span>
                                </div>
                                <div className={styles.currencyValue}>{currencies.momentum}%</div>
                                <div className={styles.currencyMeta}>
                                    <span style={{ color: momentumStatus.color }}>{momentumStatus.label}</span>
                                    <span className={styles.currencyHint}>Decays with inactivity</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${currencies.momentum}%`, background: momentumStatus.color }}
                                    />
                                </div>
                            </div>

                            <div className={styles.currencyCard}>
                                <div className={styles.currencyHeader}>
                                    <Wrench size={24} className={styles.skillIcon} />
                                    <span className={styles.currencyName}>Skill XP</span>
                                </div>
                                <div className={styles.currencyValue}>{currencies.skillXP.toLocaleString()}</div>
                                <div className={styles.currencyMeta}>
                                    <span>Track-specific</span>
                                    <span className={styles.currencyHint}>Unlocks harder missions</span>
                                </div>
                            </div>

                            <div className={styles.currencyCard}>
                                <div className={styles.currencyHeader}>
                                    <Trophy size={24} className={styles.arenaIcon} />
                                    <span className={styles.currencyName}>Arena Points</span>
                                </div>
                                <div className={styles.currencyValue}>{currencies.arenaPoints}</div>
                                <div className={styles.currencyMeta}>
                                    <span>Courage currency</span>
                                    <span className={styles.currencyHint}>Earned by facing rejection</span>
                                </div>
                            </div>

                            <div className={`${styles.currencyCard} ${currencies.incomeVerified ? styles.verified : styles.pending}`}>
                                <div className={styles.currencyHeader}>
                                    <BadgeDollarSign size={24} className={styles.incomeIcon} />
                                    <span className={styles.currencyName}>Income Proof</span>
                                </div>
                                <div className={styles.currencyValue}>
                                    {currencies.incomeVerified ? '✓ Verified' : 'Pending'}
                                </div>
                                <div className={styles.currencyMeta}>
                                    <span>{currencies.incomeVerified ? 'Graduation unlocked' : 'Earn to verify'}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Milestones */}
                    <section className={styles.milestonesSection}>
                        <h2 className={styles.sectionTitle}>
                            <Target size={20} />
                            Milestones
                        </h2>
                        <div className={styles.timeline}>
                            {milestones.map((milestone) => (
                                <div key={milestone.id} className={styles.timelineItem}>
                                    <div className={styles.timelineDot} data-type={milestone.type} />
                                    <div className={styles.timelineContent}>
                                        <span className={styles.milestoneTitle}>{milestone.title}</span>
                                        <span className={styles.milestoneDate}>
                                            {new Date(milestone.completedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* ==================== MISSIONS SECTION ==================== */}
            {activeSection === 'missions' && (
                <div className={styles.missionsSection}>
                    {/* Mission Tabs */}
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tab} ${activeTab === 'available' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('available')}
                        >
                            Available ({availableMissions.length})
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('active')}
                        >
                            Active ({activeMissions.length})
                            {pendingMissions.length > 0 && (
                                <span className={styles.pendingBadge}>{pendingMissions.length} pending</span>
                            )}
                        </button>
                        <button
                            className={`${styles.tab} ${activeTab === 'completed' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completed ({completedMissions.length})
                        </button>
                    </div>

                    {/* Mission Grid */}
                    <div className={styles.missionGrid}>
                        {activeTab === 'available' && availableMissions.map((mission) => (
                            <div key={mission.id} className={`card ${styles.missionCard}`}>
                                <div className={styles.missionHeader}>
                                    <div className={styles.domainBadge}>
                                        {getDomainIcon(mission.skillDomain)}
                                        <span>{mission.skillDomain}</span>
                                    </div>
                                    <span className={`badge ${getDifficultyColor(mission.difficulty)}`}>
                                        {mission.difficulty}
                                    </span>
                                </div>
                                <h3 className={styles.missionTitle}>{mission.title}</h3>
                                <p className={styles.missionDesc}>{mission.description}</p>
                                <div className={styles.rewards}>
                                    {mission.momentum > 0 && (
                                        <span className={styles.reward}>
                                            <Zap size={14} /> +{mission.momentum}
                                        </span>
                                    )}
                                    {mission.skillXp > 0 && (
                                        <span className={styles.reward}>
                                            <Star size={14} /> +{mission.skillXp} XP
                                        </span>
                                    )}
                                    {mission.arenaPoints > 0 && (
                                        <span className={styles.reward}>
                                            <Trophy size={14} /> +{mission.arenaPoints}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleStartMission(mission.id)}
                                    disabled={processing === mission.id}
                                >
                                    {processing === mission.id ? (
                                        <Loader2 className={styles.spinner} size={16} />
                                    ) : (
                                        <Play size={16} />
                                    )}
                                    Start Mission
                                </button>
                            </div>
                        ))}

                        {activeTab === 'active' && [...activeMissions, ...pendingMissions].map((assignment) => (
                            <div key={assignment.id} className={`card ${styles.missionCard} ${styles.active}`}>
                                <div className={styles.missionHeader}>
                                    <div className={styles.domainBadge}>
                                        {getDomainIcon(assignment.mission.skillDomain)}
                                        <span>{assignment.mission.skillDomain}</span>
                                    </div>
                                    <span className={`badge ${getDifficultyColor(assignment.mission.difficulty)}`}>
                                        {assignment.mission.difficulty}
                                    </span>
                                </div>
                                <h3 className={styles.missionTitle}>{assignment.mission.title}</h3>
                                <p className={styles.missionDesc}>{assignment.mission.description}</p>

                                {assignment.status === 'SUBMITTED' ? (
                                    <div className={styles.statusBanner}>
                                        <Clock size={14} />
                                        Awaiting Review
                                    </div>
                                ) : (
                                    <>
                                        {assignment.deadlineAt && (
                                            <div className={styles.deadline}>
                                                <Clock size={14} />
                                                <span>{formatDeadline(assignment.deadlineAt)}</span>
                                            </div>
                                        )}
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => setSubmitModal(assignment)}
                                        >
                                            <Send size={16} />
                                            Submit Completion
                                        </button>
                                    </>
                                )}
                            </div>
                        ))}

                        {activeTab === 'completed' && completedMissions.map((assignment) => (
                            <div key={assignment.id} className={`card ${styles.missionCard} ${styles.completed}`}>
                                <div className={styles.missionHeader}>
                                    <div className={styles.domainBadge}>
                                        {getDomainIcon(assignment.mission.skillDomain)}
                                        <span>{assignment.mission.skillDomain}</span>
                                    </div>
                                    <div className={styles.completedBadge}>
                                        <Check size={14} /> Completed
                                    </div>
                                </div>
                                <h3 className={styles.missionTitle}>{assignment.mission.title}</h3>
                                <p className={styles.missionDesc}>{assignment.mission.description}</p>
                                <div className={styles.rewards}>
                                    {assignment.mission.momentum > 0 && (
                                        <span className={styles.reward}>
                                            <Zap size={14} /> +{assignment.mission.momentum}
                                        </span>
                                    )}
                                    {assignment.mission.skillXp > 0 && (
                                        <span className={styles.reward}>
                                            <Star size={14} /> +{assignment.mission.skillXp} XP
                                        </span>
                                    )}
                                </div>
                                {assignment.completedAt && (
                                    <div className={styles.completedDate}>
                                        Completed {new Date(assignment.completedAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ))}

                        {activeTab === 'available' && availableMissions.length === 0 && (
                            <div className={styles.emptyState}>
                                <Target size={48} />
                                <h3>No Available Missions</h3>
                                <p>Check back later for new missions or complete your active ones first.</p>
                            </div>
                        )}

                        {activeTab === 'active' && activeMissions.length === 0 && pendingMissions.length === 0 && (
                            <div className={styles.emptyState}>
                                <Target size={48} />
                                <h3>No Active Missions</h3>
                                <p>Start a mission from the Available tab to begin earning rewards.</p>
                            </div>
                        )}

                        {activeTab === 'completed' && completedMissions.length === 0 && (
                            <div className={styles.emptyState}>
                                <Trophy size={48} />
                                <h3>No Completed Missions Yet</h3>
                                <p>Complete your first mission to see it here!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ==================== ARENA SECTION ==================== */}
            {activeSection === 'arena' && (
                <div className={styles.arenaSection}>
                    {/* Arena Stats */}
                    <div className={styles.arenaStats}>
                        <div className={styles.arenaStat}>
                            <Send size={20} />
                            <div>
                                <span className={styles.arenaStatValue}>{outreachLog.length}</span>
                                <span className={styles.arenaStatLabel}>Total Outreach</span>
                            </div>
                        </div>
                        <div className={styles.arenaStat}>
                            <ThumbsDown size={20} />
                            <div>
                                <span className={styles.arenaStatValue}>
                                    {outreachLog.filter(o => o.response === 'rejected').length}
                                </span>
                                <span className={styles.arenaStatLabel}>Rejections (Courage!)</span>
                            </div>
                        </div>
                        <div className={styles.arenaStat}>
                            <ThumbsUp size={20} />
                            <div>
                                <span className={styles.arenaStatValue}>
                                    {outreachLog.filter(o => o.response === 'positive').length}
                                </span>
                                <span className={styles.arenaStatLabel}>Positive Responses</span>
                            </div>
                        </div>
                        <div className={`${styles.arenaStat} ${styles.highlight}`}>
                            <Trophy size={20} />
                            <div>
                                <span className={styles.arenaStatValue}>{currencies.arenaPoints}</span>
                                <span className={styles.arenaStatLabel}>Arena Points</span>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Streak */}
                    <div className={styles.weeklyCard}>
                        <Flame size={24} className={styles.weeklyIcon} />
                        <div className={styles.weeklyContent}>
                            <span className={styles.weeklyValue}>{outreachLog.length} outreach this week</span>
                            <span className={styles.weeklyHint}>Keep the momentum going!</span>
                        </div>
                        <div className={styles.weeklyStreak}>
                            {[1, 2, 3, 4, 5].map((day) => (
                                <div
                                    key={day}
                                    className={`${styles.streakDot} ${day <= outreachLog.length ? styles.activeDot : ''}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Outreach Log */}
                    <section className={styles.logSection}>
                        <div className={styles.logHeader}>
                            <h2 className={styles.sectionTitle}>
                                <Users size={20} />
                                Recent Outreach
                            </h2>
                            <button className={styles.logButton}>
                                <Plus size={18} />
                                Log Outreach
                            </button>
                        </div>
                        <div className={styles.logList}>
                            {outreachLog.map((entry) => (
                                <div key={entry.id} className={styles.logEntry}>
                                    <div className={styles.logInfo}>
                                        <span className={styles.logTarget}>{entry.target}</span>
                                        <span className={styles.logMeta}>
                                            {entry.type} · {new Date(entry.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className={styles.logStatus}>
                                        <span className={`${styles.responseTag} ${styles[entry.response]}`}>
                                            {getResponseIcon(entry.response)}
                                            {getResponseLabel(entry.response)}
                                        </span>
                                        <span className={styles.pointsEarned}>+{entry.arenaPointsEarned} AP</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Encouragement Banner */}
                    <section className={styles.encouragementBanner}>
                        <Trophy size={32} className={styles.encouragementIcon} />
                        <div>
                            <h3>Every rejection is proof you're in the arena</h3>
                            <p>Those who don't try earn nothing. You're earning with every attempt.</p>
                        </div>
                    </section>
                </div>
            )}

            {/* Submit Modal */}
            {submitModal && (
                <div className={styles.modalOverlay} onClick={() => setSubmitModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Submit Mission</h2>
                            <button onClick={() => setSubmitModal(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.modalMission}>{submitModal.mission.title}</p>
                            <div className={styles.formGroup}>
                                <label>Describe how you completed this mission</label>
                                <textarea
                                    value={proofText}
                                    onChange={(e) => setProofText(e.target.value)}
                                    placeholder="Explain what you did..."
                                    rows={4}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Link to proof (optional)</label>
                                <input
                                    type="url"
                                    value={proofUrl}
                                    onChange={(e) => setProofUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setSubmitModal(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.submitBtn}
                                onClick={handleSubmitMission}
                                disabled={processing === submitModal.id || !proofText}
                            >
                                {processing === submitModal.id ? (
                                    <Loader2 className={styles.spinner} size={16} />
                                ) : (
                                    <Send size={16} />
                                )}
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
