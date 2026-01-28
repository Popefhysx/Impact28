'use client';

import { useState } from 'react';
import { Target, Clock, Check, AlertTriangle, Star, Zap, Trophy, ChevronRight, Play } from 'lucide-react';
import styles from './page.module.css';

// Mock mission data
const availableMissions = [
    {
        id: '1',
        title: 'Complete Your Profile',
        description: 'Add your bio, profile picture, and skill preferences.',
        skillDomain: 'SOFT',
        difficulty: 'EASY',
        momentum: 10,
        skillXp: 15,
        arenaPoints: 0,
        status: 'available',
    },
    {
        id: '2',
        title: 'First Client Outreach',
        description: 'Contact 3 potential clients and introduce your service.',
        skillDomain: 'COMMERCIAL',
        difficulty: 'MEDIUM',
        momentum: 25,
        skillXp: 20,
        arenaPoints: 30,
        status: 'available',
    },
    {
        id: '3',
        title: 'Design Challenge: Logo',
        description: 'Create a logo design for a fictional company.',
        skillDomain: 'TECHNICAL',
        difficulty: 'MEDIUM',
        momentum: 20,
        skillXp: 40,
        arenaPoints: 0,
        status: 'available',
    },
];

const activeMissions = [
    {
        id: '4',
        title: 'Weekly Pitch Practice',
        description: 'Record a 2-minute video pitching your services.',
        skillDomain: 'COMMERCIAL',
        difficulty: 'HARD',
        momentum: 40,
        skillXp: 30,
        arenaPoints: 50,
        progress: 60,
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        status: 'IN_PROGRESS',
    },
];

const completedMissions = [
    {
        id: '5',
        title: 'Welcome Onboarding',
        description: 'Complete the onboarding tutorial.',
        skillDomain: 'SOFT',
        difficulty: 'EASY',
        momentum: 5,
        skillXp: 10,
        arenaPoints: 0,
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'VERIFIED',
    },
];

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
        case 'TECHNICAL': return <Star size={16} />;
        case 'SOFT': return <Zap size={16} />;
        case 'COMMERCIAL': return <Trophy size={16} />;
        default: return <Target size={16} />;
    }
}

function formatDeadline(date: Date) {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return 'Due soon';
}

export default function MissionsPage() {
    const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed'>('available');

    const stats = {
        completed: completedMissions.length,
        inProgress: activeMissions.length,
        available: availableMissions.length,
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Missions</h1>
                    <p className={styles.subtitle}>Complete missions to earn rewards and level up</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{stats.completed}</span>
                        <span className={styles.statLabel}>Completed</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{stats.inProgress}</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{stats.available}</span>
                        <span className={styles.statLabel}>Available</span>
                    </div>
                </div>
            </header>

            {/* Tabs */}
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
                        <button className="btn btn-primary">
                            <Play size={16} /> Start Mission
                        </button>
                    </div>
                ))}

                {activeTab === 'active' && activeMissions.map((mission) => (
                    <div key={mission.id} className={`card ${styles.missionCard} ${styles.active}`}>
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

                        <div className={styles.progressSection}>
                            <div className={styles.progressHeader}>
                                <span>Progress</span>
                                <span>{mission.progress}%</span>
                            </div>
                            <div className={styles.progressTrack}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${mission.progress}%` }}
                                />
                            </div>
                        </div>

                        <div className={styles.deadline}>
                            <Clock size={14} />
                            <span>{formatDeadline(mission.deadline)}</span>
                        </div>

                        <button className="btn btn-primary">
                            Continue <ChevronRight size={16} />
                        </button>
                    </div>
                ))}

                {activeTab === 'completed' && completedMissions.map((mission) => (
                    <div key={mission.id} className={`card ${styles.missionCard} ${styles.completed}`}>
                        <div className={styles.missionHeader}>
                            <div className={styles.domainBadge}>
                                {getDomainIcon(mission.skillDomain)}
                                <span>{mission.skillDomain}</span>
                            </div>
                            <div className={styles.completedBadge}>
                                <Check size={14} /> Completed
                            </div>
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
                        </div>
                        <div className={styles.completedDate}>
                            Completed {mission.completedAt.toLocaleDateString()}
                        </div>
                    </div>
                ))}

                {activeTab === 'active' && activeMissions.length === 0 && (
                    <div className={styles.emptyState}>
                        <Target size={48} />
                        <h3>No Active Missions</h3>
                        <p>Start a mission from the Available tab to begin earning rewards.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
