'use client';

import { Zap, Star, Trophy, TrendingUp, ArrowUpRight, ArrowDownRight, Banknote } from 'lucide-react';
import styles from './page.module.css';

// Mock data
const currencyData = {
    momentum: 78,
    skillXp: 1250,
    arenaPoints: 340,
    incomeProof: 0,
};

const triadScores = {
    technical: 65,
    soft: 55,
    commercial: 35,
};

const recentTransactions = [
    { id: '1', type: 'MOMENTUM', amount: 15, reason: 'Daily check-in', createdAt: new Date(Date.now() - 1000 * 60 * 30) },
    { id: '2', type: 'SKILL_XP', amount: 40, reason: 'Mission: Design Challenge', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    { id: '3', type: 'ARENA_POINTS', amount: 25, reason: 'Client outreach attempt', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5) },
    { id: '4', type: 'MOMENTUM', amount: -10, reason: 'Momentum decay (inactivity)', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    { id: '5', type: 'SKILL_XP', amount: 20, reason: 'Mission: Profile Setup', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48) },
];

function getCurrencyIcon(type: string) {
    switch (type) {
        case 'MOMENTUM': return <Zap size={16} />;
        case 'SKILL_XP': return <Star size={16} />;
        case 'ARENA_POINTS': return <Trophy size={16} />;
        case 'INCOME_PROOF': return <Banknote size={16} />;
        default: return <TrendingUp size={16} />;
    }
}

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function SkillTriad({ technical, soft, commercial }: { technical: number; soft: number; commercial: number }) {
    // Calculate triangle points for visualization
    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 80;

    // Triangle vertices (equilateral)
    const top = { x: centerX, y: centerY - radius };
    const bottomLeft = { x: centerX - radius * 0.866, y: centerY + radius * 0.5 };
    const bottomRight = { x: centerX + radius * 0.866, y: centerY + radius * 0.5 };

    // User scores as percentages of the radius
    const techPoint = {
        x: centerX + (top.x - centerX) * (technical / 100),
        y: centerY + (top.y - centerY) * (technical / 100),
    };
    const softPoint = {
        x: centerX + (bottomLeft.x - centerX) * (soft / 100),
        y: centerY + (bottomLeft.y - centerY) * (soft / 100),
    };
    const commPoint = {
        x: centerX + (bottomRight.x - centerX) * (commercial / 100),
        y: centerY + (bottomRight.y - centerY) * (commercial / 100),
    };

    const isBalanced = Math.abs(technical - soft) < 20 &&
        Math.abs(soft - commercial) < 20 &&
        Math.abs(commercial - technical) < 20;

    return (
        <div className={styles.triadContainer}>
            <svg viewBox={`0 0 ${size} ${size}`} className={styles.triadSvg}>
                {/* Outer triangle */}
                <polygon
                    points={`${top.x},${top.y} ${bottomLeft.x},${bottomLeft.y} ${bottomRight.x},${bottomRight.y}`}
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="2"
                />

                {/* Guide lines */}
                <line x1={centerX} y1={centerY} x2={top.x} y2={top.y} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4" />
                <line x1={centerX} y1={centerY} x2={bottomLeft.x} y2={bottomLeft.y} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4" />
                <line x1={centerX} y1={centerY} x2={bottomRight.x} y2={bottomRight.y} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="4" />

                {/* User score triangle */}
                <polygon
                    points={`${techPoint.x},${techPoint.y} ${softPoint.x},${softPoint.y} ${commPoint.x},${commPoint.y}`}
                    fill="rgba(197, 173, 103, 0.3)"
                    stroke="var(--gold-warm)"
                    strokeWidth="2"
                />

                {/* Score points */}
                <circle cx={techPoint.x} cy={techPoint.y} r="6" fill="var(--gold-warm)" />
                <circle cx={softPoint.x} cy={softPoint.y} r="6" fill="var(--gold-warm)" />
                <circle cx={commPoint.x} cy={commPoint.y} r="6" fill="var(--gold-warm)" />
            </svg>

            {/* Labels */}
            <div className={styles.triadLabels}>
                <div className={`${styles.triadLabel} ${styles.labelTop}`}>
                    <Star size={14} />
                    <span>Technical</span>
                    <strong>{technical}%</strong>
                </div>
                <div className={`${styles.triadLabel} ${styles.labelBottomLeft}`}>
                    <Zap size={14} />
                    <span>Soft</span>
                    <strong>{soft}%</strong>
                </div>
                <div className={`${styles.triadLabel} ${styles.labelBottomRight}`}>
                    <Trophy size={14} />
                    <span>Commercial</span>
                    <strong>{commercial}%</strong>
                </div>
            </div>

            <div className={styles.triadStatus}>
                {isBalanced ? (
                    <span className={styles.balanced}>Skills are balanced</span>
                ) : (
                    <span className={styles.imbalanced}>Focus on Commercial skills</span>
                )}
            </div>
        </div>
    );
}

export default function CurrencyPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Currency Dashboard</h1>
                <p className={styles.subtitle}>Track your progress and earnings</p>
            </header>

            {/* Currency Cards */}
            <div className={styles.currencyGrid}>
                <div className={`card ${styles.currencyCard}`}>
                    <div className={styles.currencyHeader}>
                        <Zap size={24} className={styles.momentumIcon} />
                        <span className={styles.currencyName}>Momentum</span>
                    </div>
                    <div className={styles.currencyValue}>{currencyData.momentum}</div>
                    <div className={styles.currencyProgress}>
                        <div className={styles.progressBar} style={{ width: `${currencyData.momentum}%` }} />
                    </div>
                    <p className={styles.currencyHint}>Keep above 50 to maintain support eligibility</p>
                </div>

                <div className={`card ${styles.currencyCard}`}>
                    <div className={styles.currencyHeader}>
                        <Star size={24} className={styles.xpIcon} />
                        <span className={styles.currencyName}>Skill XP</span>
                    </div>
                    <div className={styles.currencyValue}>{currencyData.skillXp.toLocaleString()}</div>
                    <p className={styles.currencyHint}>Earn through mission completion</p>
                </div>

                <div className={`card ${styles.currencyCard}`}>
                    <div className={styles.currencyHeader}>
                        <Trophy size={24} className={styles.arenaIcon} />
                        <span className={styles.currencyName}>Arena Points</span>
                    </div>
                    <div className={styles.currencyValue}>{currencyData.arenaPoints}</div>
                    <p className={styles.currencyHint}>Earned through market exposure and rejection</p>
                </div>

                <div className={`card ${styles.currencyCard}`}>
                    <div className={styles.currencyHeader}>
                        <Banknote size={24} className={styles.incomeIcon} />
                        <span className={styles.currencyName}>Verified Income</span>
                    </div>
                    <div className={styles.currencyValue}>₦{currencyData.incomeProof.toLocaleString()}</div>
                    <p className={styles.currencyHint}>Submit proof to earn this currency</p>
                </div>
            </div>

            {/* Skill Triad Section */}
            <div className={styles.panels}>
                <div className={`card ${styles.triadPanel}`}>
                    <h2>Skill Triad</h2>
                    <p className={styles.panelSubtitle}>Balance all three dimensions to graduate</p>
                    <SkillTriad
                        technical={triadScores.technical}
                        soft={triadScores.soft}
                        commercial={triadScores.commercial}
                    />
                </div>

                {/* Transaction History */}
                <div className={`card ${styles.historyPanel}`}>
                    <h2>Recent Activity</h2>
                    <div className={styles.transactionList}>
                        {recentTransactions.map((tx) => (
                            <div key={tx.id} className={styles.transaction}>
                                <div className={styles.txIcon}>
                                    {getCurrencyIcon(tx.type)}
                                </div>
                                <div className={styles.txDetails}>
                                    <span className={styles.txReason}>{tx.reason}</span>
                                    <span className={styles.txTime}>{formatTimeAgo(tx.createdAt)}</span>
                                </div>
                                <div className={`${styles.txAmount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                                    {tx.amount > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
