'use client';

import { useState, useEffect } from 'react';
import { Zap, Star, Trophy, DollarSign, Flame, Loader2, AlertCircle, Calendar, Layers } from 'lucide-react';
import styles from './page.module.css';

// Types from backend
interface DashboardProgress {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        identityLevel: string;
        skillTrack: string | null;
        daysInProgram: number;
        streak: number;
    };
    currencies: {
        momentum: number;
        skillXp: number;
        arenaPoints: number;
        incomeProof: number;
    };
    support: {
        eligible: boolean;
        reason?: string;
    };
    missions: {
        active: number;
        completed: number;
        pending: number;
    };
    phase?: {
        current: string;
        name: string;
        order: number;
        daysRemaining: number;
        progress: number;
    };
    upcomingEvents?: {
        id: string;
        title: string;
        date: string;
        time?: string;
        type: string;
    }[];
}

// Mock data for fallback
const mockData: DashboardProgress = {
    user: {
        id: 'mock-001',
        firstName: 'Adaeze',
        lastName: 'Okonkwo',
        email: 'adaeze@email.com',
        identityLevel: 'L3_EXPOSED',
        skillTrack: 'GRAPHIC_DESIGN',
        daysInProgram: 45,
        streak: 7,
    },
    currencies: {
        momentum: 78,
        skillXp: 1250,
        arenaPoints: 340,
        incomeProof: 25000,
    },
    support: {
        eligible: true,
    },
    missions: {
        active: 2,
        completed: 12,
        pending: 1,
    },
    phase: {
        current: 'WEEK_3',
        name: 'Week 3 - Skill Building',
        order: 3,
        daysRemaining: 4,
        progress: 43,
    },
    upcomingEvents: [
        { id: '1', title: 'Weekly Check-in', date: '2026-02-05T10:00:00Z', time: '10:00', type: 'SESSION' },
        { id: '2', title: 'Portfolio Review Deadline', date: '2026-02-08T17:00:00Z', type: 'DEADLINE' },
    ],
};

const mockMissions = [
    { id: '1', title: 'Complete Profile Setup', difficulty: 'EASY', reward: 50, progress: 80 },
    { id: '2', title: 'First Client Outreach', difficulty: 'MEDIUM', reward: 150, progress: 30 },
];

// History Item Type
interface HistoryItem {
    level: string;
    previousLevel: string;
    reason: string;
    achievedAt: string;
}

export default function ParticipantDashboard() {
    const [data, setData] = useState<DashboardProgress | null>(null);
    const [missions, setMissions] = useState(mockMissions);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_BASE}/progress`, {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const progressData = await response.json();
                    setData(progressData);
                } else if (process.env.NODE_ENV !== 'production') {
                    console.log('Using mock data - API not available');
                    setData(mockData);
                } else {
                    setData(null);
                }
            } catch (err) {
                console.error('Failed to fetch progress:', err);
                if (process.env.NODE_ENV !== 'production') {
                    setData(mockData);
                } else {
                    setData(null);
                }
            } finally {
                setLoading(false);
            }
        };

        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_BASE}/progress/history`, {
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const historyData = await response.json();
                    setHistory(historyData);
                }
            } catch (err) {
                console.error('Failed to fetch history:', err);
            }
        };

        fetchProgress();
        fetchHistory();
    }, [API_BASE]);

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.errorState}>
                    <AlertCircle size={32} />
                    <p>Unable to load dashboard data</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h1>Welcome back, {data.user.firstName}!</h1>
                    <p className={styles.subtitle}>Here's your daily progress</p>
                </div>
                <div className={styles.streak}>
                    <Flame size={18} />
                    <span>{data.user.streak} day streak</span>
                </div>
            </header>

            {/* Currency Overview */}
            <div className={styles.currencyGrid}>
                <div className={styles.currencyCard}>
                    <Zap size={28} className={styles.currencyIcon} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{data.currencies.momentum}</span>
                        <span className={styles.currencyLabel}>Momentum</span>
                    </div>
                    <div className={styles.currencyProgress}>
                        <div className={styles.progressBar} style={{ width: `${Math.min(data.currencies.momentum, 100)}%` }} />
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <Star size={28} className={styles.currencyIcon} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{data.currencies.skillXp.toLocaleString()}</span>
                        <span className={styles.currencyLabel}>Skill XP</span>
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <Trophy size={28} className={styles.currencyIcon} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{data.currencies.arenaPoints}</span>
                        <span className={styles.currencyLabel}>Arena Points</span>
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <DollarSign size={28} className={styles.currencyIcon} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>₦{data.currencies.incomeProof.toLocaleString()}</span>
                        <span className={styles.currencyLabel}>Verified Income</span>
                    </div>
                </div>
            </div>

            {/* Phase Tracker and Upcoming Events */}
            <div className={styles.phaseEventsRow}>
                {/* Phase Tracker */}
                {data.phase && (
                    <div className={`card ${styles.phaseCard}`}>
                        <div className={styles.phaseHeader}>
                            <Layers size={20} />
                            <h3>Current Phase</h3>
                        </div>
                        <div className={styles.phaseInfo}>
                            <span className={styles.phaseName}>{data.phase.name}</span>
                            <span className={styles.phaseMeta}>
                                {data.phase.daysRemaining > 0
                                    ? `${data.phase.daysRemaining} days remaining`
                                    : 'Complete'}
                            </span>
                        </div>
                        <div className={styles.phaseProgress}>
                            <div className={styles.phaseProgressTrack}>
                                <div
                                    className={styles.phaseProgressFill}
                                    style={{ width: `${data.phase.progress}%` }}
                                />
                            </div>
                            <span className={styles.phaseProgressLabel}>{data.phase.progress}%</span>
                        </div>
                    </div>
                )}

                {/* Upcoming Events */}
                {data.upcomingEvents && data.upcomingEvents.length > 0 && (
                    <div className={`card ${styles.eventsCard}`}>
                        <div className={styles.eventsHeader}>
                            <Calendar size={20} />
                            <h3>Upcoming Events</h3>
                        </div>
                        <div className={styles.eventsList}>
                            {data.upcomingEvents.slice(0, 3).map(event => (
                                <div key={event.id} className={styles.eventItem}>
                                    <div className={styles.eventDate}>
                                        <span className={styles.eventDay}>
                                            {new Date(event.date).getDate()}
                                        </span>
                                        <span className={styles.eventMonth}>
                                            {new Date(event.date).toLocaleDateString('en', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className={styles.eventDetails}>
                                        <span className={styles.eventTitle}>{event.title}</span>
                                        {event.time && (
                                            <span className={styles.eventTime}>{event.time}</span>
                                        )}
                                    </div>
                                    <span className={`${styles.eventType} ${styles[`event${event.type}`]}`}>
                                        {event.type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className={styles.panels}>
                {/* Active Missions */}
                <div className={`card ${styles.missionsPanel}`}>
                    <h2>Active Missions ({data.missions.active})</h2>
                    <div className={styles.missionsList}>
                        {missions.map((mission) => (
                            <div key={mission.id} className={styles.missionCard}>
                                <div className={styles.missionHeader}>
                                    <h3>{mission.title}</h3>
                                    <span className={`badge ${mission.difficulty === 'EASY' ? 'badge-success' : 'badge-warning'}`}>
                                        {mission.difficulty}
                                    </span>
                                </div>
                                <div className={styles.missionMeta}>
                                    <span>+{mission.reward} XP</span>
                                </div>
                                <div className={styles.missionProgress}>
                                    <div className={styles.progressTrack}>
                                        <div className={styles.progressFill} style={{ width: `${mission.progress}%` }} />
                                    </div>
                                    <span>{mission.progress}%</span>
                                </div>
                                <button className="btn btn-primary">Continue</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Identity History */}
                <div className={`card ${styles.historyPanel}`}>
                    <h2>Journey</h2>
                    <div className={styles.timeline}>
                        {history.length === 0 ? (
                            <div className={styles.timelineItem}>
                                <div className={styles.timelineDot} />
                                <div className={styles.timelineContent}>
                                    <span className={styles.timelineDate}>Just Started</span>
                                    <h4>Profile Activated</h4>
                                    <p>Welcome to Impact OS.</p>
                                </div>
                            </div>
                        ) : (
                            history.map((event, index) => (
                                <div key={index} className={`${styles.timelineItem} ${index === history.length - 1 ? styles.active : ''}`}>
                                    <div className={styles.timelineDot} />
                                    <div className={styles.timelineContent}>
                                        <span className={styles.timelineDate}>
                                            {new Date(event.achievedAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                        <h4>{event.level.replace(/_/g, ' ')}</h4>
                                        <p>{event.reason || 'Level Up'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.quickStats}>
                <div className={styles.quickStat}>
                    <span className={styles.quickStatValue}>{data.user.daysInProgram}</span>
                    <span className={styles.quickStatLabel}>Days in Program</span>
                </div>
                <div className={styles.quickStat}>
                    <span className={styles.quickStatValue}>{data.missions.completed}</span>
                    <span className={styles.quickStatLabel}>Missions Completed</span>
                </div>
                <div className={styles.quickStat}>
                    <span className={styles.quickStatValue}>{data.missions.pending}</span>
                    <span className={styles.quickStatLabel}>Pending Review</span>
                </div>
            </div>
        </div>
    );
}
