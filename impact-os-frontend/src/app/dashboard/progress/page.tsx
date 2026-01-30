'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Zap, Wrench, Trophy, BadgeDollarSign, Star, ChevronRight, Target } from 'lucide-react';
import styles from './page.module.css';

// Identity Levels from governance doc
const identityLevels = [
    { level: 'L0', name: 'Applicant', description: 'Intake submitted' },
    { level: 'L1', name: 'Initiate', description: 'Onboarding completed' },
    { level: 'L2', name: 'Builder', description: 'Skill missions started' },
    { level: 'L3', name: 'Operator', description: 'Market exposure begun' },
    { level: 'L4', name: 'Earner', description: 'Income verified' },
    { level: 'L5', name: 'Catalyst', description: 'Graduation achieved' },
];

interface CurrencyData {
    momentum: number;
    skillXP: number;
    arenaPoints: number;
    incomeVerified: boolean;
}

interface Milestone {
    id: string;
    title: string;
    completedAt: string;
    type: 'mission' | 'level' | 'income';
}

export default function ProgressPage() {
    const [currentLevel, setCurrentLevel] = useState(2); // L2 Builder
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

    // Calculate momentum decay indicator
    const getMomentumStatus = (momentum: number) => {
        if (momentum >= 80) return { label: 'Strong', color: 'var(--success)' };
        if (momentum >= 50) return { label: 'Steady', color: 'var(--gold-warm)' };
        if (momentum >= 25) return { label: 'Declining', color: 'var(--warning)' };
        return { label: 'Critical', color: 'var(--error)' };
    };

    const momentumStatus = getMomentumStatus(currencies.momentum);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Your Progress</h1>
                    <p>Track your journey from Applicant to Catalyst</p>
                </div>
            </header>

            {/* Identity Level Card */}
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
                <div className={styles.currentLevelCard}>
                    <div className={styles.currentLevelIcon}>
                        <Star size={24} />
                    </div>
                    <div>
                        <div className={styles.currentLevelLabel}>Current Level</div>
                        <div className={styles.currentLevelName}>
                            {identityLevels[currentLevel].level} — {identityLevels[currentLevel].name}
                        </div>
                        <div className={styles.nextLevel}>
                            Next: {identityLevels[currentLevel + 1]?.name || 'Graduation'} — {identityLevels[currentLevel + 1]?.description || 'Complete the journey'}
                        </div>
                    </div>
                </div>
            </section>

            {/* Currency Dashboard */}
            <section className={styles.currencySection}>
                <h2 className={styles.sectionTitle}>
                    <TrendingUp size={20} />
                    Behavioral Currencies
                </h2>
                <div className={styles.currencyGrid}>
                    {/* Momentum */}
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

                    {/* Skill XP */}
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
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.min(100, (currencies.skillXP / 5000) * 100)}%`, background: 'var(--accent-blue)' }}
                            />
                        </div>
                    </div>

                    {/* Arena Points */}
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
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${Math.min(100, (currencies.arenaPoints / 50) * 100)}%`, background: 'var(--gold-warm)' }}
                            />
                        </div>
                    </div>

                    {/* Income Proof */}
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
                            <span className={styles.currencyHint}>The ultimate currency</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Milestones Timeline */}
            <section className={styles.milestonesSection}>
                <h2 className={styles.sectionTitle}>
                    <Target size={20} />
                    Milestones
                </h2>
                <div className={styles.timeline}>
                    {milestones.map((milestone, index) => (
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
    );
}
