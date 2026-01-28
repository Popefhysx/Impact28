'use client';

import { Zap, Star, Trophy, DollarSign, Flame, Check } from 'lucide-react';
import styles from './page.module.css';

// Mock user data
const userData = {
    name: 'Adaeze',
    level: 'L3_EXPOSED',
    levelName: 'L3 Exposed',
    momentum: 78,
    skillXP: 1250,
    arenaPoints: 340,
    incomeProof: 0,
    stipendStatus: 'ELIGIBLE',
    nextStipendAmount: 15000,
    activeMissions: 2,
    completedMissions: 12,
};

const activeMissions = [
    { id: '1', title: 'Complete Profile Setup', difficulty: 'EASY', reward: 50, progress: 80 },
    { id: '2', title: 'First Client Outreach', difficulty: 'MEDIUM', reward: 150, progress: 30 },
];

export default function ParticipantDashboard() {
    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <h1>Welcome back, {userData.name}!</h1>
                    <p className={styles.subtitle}>Here's your daily progress</p>
                </div>
                <div className={styles.streak}>
                    <Flame size={18} />
                    <span>7 day streak</span>
                </div>
            </header>

            {/* Currency Overview */}
            <div className={styles.currencyGrid}>
                <div className={styles.currencyCard}>
                    <Zap size={28} className={styles.currencyIcon} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{userData.momentum}</span>
                        <span className={styles.currencyLabel}>Momentum</span>
                    </div>
                    <div className={styles.currencyProgress}>
                        <div className={styles.progressBar} style={{ width: `${userData.momentum}%` }} />
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <Star size={28} className={styles.currencyIcon} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{userData.skillXP.toLocaleString()}</span>
                        <span className={styles.currencyLabel}>Skill XP</span>
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <Trophy size={28} className={styles.currencyIcon} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>{userData.arenaPoints}</span>
                        <span className={styles.currencyLabel}>Arena Points</span>
                    </div>
                </div>

                <div className={styles.currencyCard}>
                    <DollarSign size={28} className={styles.currencyIcon} />
                    <div className={styles.currencyInfo}>
                        <span className={styles.currencyValue}>${userData.incomeProof}</span>
                        <span className={styles.currencyLabel}>Verified Income</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.panels}>
                {/* Active Missions */}
                <div className={`card ${styles.missionsPanel}`}>
                    <h2>Active Missions</h2>
                    <div className={styles.missionsList}>
                        {activeMissions.map((mission) => (
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

                {/* Stipend Status */}
                <div className={`card ${styles.stipendPanel}`}>
                    <h2>Stipend Status</h2>
                    <div className={styles.stipendStatus}>
                        <div className={`${styles.stipendBadge} ${styles.eligible}`}>
                            <Check size={16} /> Eligible
                        </div>
                        <div className={styles.stipendAmount}>
                            <span className={styles.amountLabel}>Next Payout</span>
                            <span className={styles.amountValue}>₦{userData.nextStipendAmount.toLocaleString()}</span>
                        </div>
                        <div className={styles.stipendInfo}>
                            <p>Keep your momentum above 50 to stay eligible!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
