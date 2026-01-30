'use client';

import { useState, useEffect } from 'react';
import { Zap, Star, Trophy, DollarSign, Flame, Loader2, AlertCircle } from 'lucide-react';
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
};

const mockMissions = [
    { id: '1', title: 'Complete Profile Setup', difficulty: 'EASY', reward: 50, progress: 80 },
    { id: '2', title: 'First Client Outreach', difficulty: 'MEDIUM', reward: 150, progress: 30 },
];

export default function ParticipantDashboard() {
    const [data, setData] = useState<DashboardProgress | null>(null);
    const [missions, setMissions] = useState(mockMissions);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await fetch('/api/progress', {
                    credentials: 'include',
                });

                if (response.ok) {
                    const progressData = await response.json();
                    setData(progressData);
                } else {
                    // Use mock data in development
                    console.log('Using mock data - API not available');
                    setData(mockData);
                }
            } catch (err) {
                console.error('Failed to fetch progress:', err);
                setData(mockData);
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, []);

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
