'use client';

import { useState, useEffect } from 'react';
import { Trophy, Send, ThumbsDown, ThumbsUp, Clock, Target, Users, Flame, Plus, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

interface OutreachEntry {
    id: string;
    type: 'email' | 'dm' | 'call' | 'message';
    target: string;
    sentAt: string;
    response: 'pending' | 'no_response' | 'rejected' | 'positive';
    arenaPointsEarned: number;
}

interface MissionProgress {
    id: string;
    title: string;
    required: number;
    completed: number;
    deadline: string;
}

export default function ArenaPage() {
    const [outreachLog, setOutreachLog] = useState<OutreachEntry[]>([
        { id: '1', type: 'email', target: 'Design Agency XYZ', sentAt: '2026-01-28', response: 'rejected', arenaPointsEarned: 3 },
        { id: '2', type: 'dm', target: 'Freelance Lead via LinkedIn', sentAt: '2026-01-27', response: 'no_response', arenaPointsEarned: 2 },
        { id: '3', type: 'message', target: 'Local Business Owner', sentAt: '2026-01-26', response: 'positive', arenaPointsEarned: 5 },
        { id: '4', type: 'call', target: 'Potential Client Referral', sentAt: '2026-01-25', response: 'pending', arenaPointsEarned: 2 },
        { id: '5', type: 'email', target: 'Startup Founder', sentAt: '2026-01-24', response: 'rejected', arenaPointsEarned: 3 },
    ]);

    const [activeMissions, setActiveMissions] = useState<MissionProgress[]>([
        { id: '1', title: 'Contact 5 potential clients', required: 5, completed: 3, deadline: '2026-01-31' },
        { id: '2', title: 'Get 2 portfolio reviews', required: 2, completed: 1, deadline: '2026-02-02' },
    ]);

    const [stats, setStats] = useState({
        totalOutreach: 23,
        totalRejections: 14,
        totalPositive: 3,
        arenaPoints: 67,
        weeklyOutreach: 5,
    });

    const getResponseIcon = (response: string) => {
        switch (response) {
            case 'rejected': return <ThumbsDown size={16} className={styles.rejectedIcon} />;
            case 'positive': return <ThumbsUp size={16} className={styles.positiveIcon} />;
            case 'no_response': return <Clock size={16} className={styles.pendingIcon} />;
            default: return <Clock size={16} className={styles.pendingIcon} />;
        }
    };

    const getResponseLabel = (response: string) => {
        switch (response) {
            case 'rejected': return 'Rejected';
            case 'positive': return 'Positive';
            case 'no_response': return 'No Response';
            default: return 'Pending';
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>The Arena</h1>
                    <p>Your outreach, exposure, and courage tracker</p>
                </div>
                <button className={styles.logButton}>
                    <Plus size={18} />
                    Log Outreach
                </button>
            </header>

            {/* Stats Cards */}
            <section className={styles.statsSection}>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>
                            <Send size={20} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.totalOutreach}</span>
                            <span className={styles.statLabel}>Total Outreach</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.rejectionIcon}`}>
                            <ThumbsDown size={20} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.totalRejections}</span>
                            <span className={styles.statLabel}>Rejections (Courage!)</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.positiveStatIcon}`}>
                            <ThumbsUp size={20} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.totalPositive}</span>
                            <span className={styles.statLabel}>Positive Responses</span>
                        </div>
                    </div>
                    <div className={`${styles.statCard} ${styles.arenaCard}`}>
                        <div className={`${styles.statIcon} ${styles.arenaStatIcon}`}>
                            <Trophy size={20} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.arenaPoints}</span>
                            <span className={styles.statLabel}>Arena Points</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Weekly Progress */}
            <section className={styles.weeklySection}>
                <div className={styles.weeklyCard}>
                    <Flame size={24} className={styles.weeklyIcon} />
                    <div className={styles.weeklyContent}>
                        <span className={styles.weeklyValue}>{stats.weeklyOutreach} outreach this week</span>
                        <span className={styles.weeklyHint}>Keep the momentum going!</span>
                    </div>
                    <div className={styles.weeklyStreak}>
                        {[1, 2, 3, 4, 5].map((day) => (
                            <div
                                key={day}
                                className={`${styles.streakDot} ${day <= stats.weeklyOutreach ? styles.active : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <div className={styles.twoColumn}>
                {/* Active Outreach Missions */}
                <section className={styles.missionsSection}>
                    <h2 className={styles.sectionTitle}>
                        <Target size={20} />
                        Active Outreach Missions
                    </h2>
                    <div className={styles.missionsList}>
                        {activeMissions.map((mission) => (
                            <div key={mission.id} className={styles.missionCard}>
                                <div className={styles.missionHeader}>
                                    <span className={styles.missionTitle}>{mission.title}</span>
                                    <span className={styles.missionDeadline}>Due {new Date(mission.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className={styles.missionProgress}>
                                    <div className={styles.missionBar}>
                                        <div
                                            className={styles.missionFill}
                                            style={{ width: `${(mission.completed / mission.required) * 100}%` }}
                                        />
                                    </div>
                                    <span className={styles.missionCount}>{mission.completed}/{mission.required}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Outreach Log */}
                <section className={styles.logSection}>
                    <h2 className={styles.sectionTitle}>
                        <Users size={20} />
                        Recent Outreach
                    </h2>
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
            </div>

            {/* Encouragement Banner */}
            <section className={styles.encouragementBanner}>
                <Trophy size={32} className={styles.encouragementIcon} />
                <div>
                    <h3>Every rejection is proof you're in the arena</h3>
                    <p>Those who don't try earn nothing. You're earning with every attempt.</p>
                </div>
            </section>
        </div>
    );
}
