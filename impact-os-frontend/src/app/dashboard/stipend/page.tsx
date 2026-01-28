'use client';

import { Zap, Check, AlertTriangle, TrendingUp, Calendar, Wallet, Clock, Info } from 'lucide-react';
import styles from './page.module.css';

// Mock data
const stipendData = {
    eligible: true,
    tier: 'STANDARD',
    amount: 10000,
    momentum: 78,
    momentumRequired: 50,
    daysActive: 23,
    nextPayoutDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    identityLevel: 'L2_SKILLED',
};

const stipendHistory = [
    { id: '1', amount: 10000, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), status: 'PAID' },
    { id: '2', amount: 10000, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), status: 'PAID' },
    { id: '3', amount: 5000, date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), status: 'PAID' },
];

const requirements = [
    { label: 'Momentum above 50', met: true, value: `${stipendData.momentum}/50` },
    { label: 'Account active', met: true, value: 'Active' },
    { label: 'Weekly check-in complete', met: true, value: 'Completed' },
    { label: 'No flags on account', met: true, value: 'Clear' },
];

function getTierInfo(tier: string) {
    switch (tier) {
        case 'BASE':
            return { label: 'Base Tier', description: 'Momentum 50-99', color: 'var(--text-secondary)' };
        case 'STANDARD':
            return { label: 'Standard Tier', description: 'Momentum 100-199', color: 'var(--gold-warm)' };
        case 'BONUS':
            return { label: 'Bonus Tier', description: 'Momentum 200+', color: 'var(--accent-success)' };
        default:
            return { label: 'Not Eligible', description: 'Momentum below 50', color: 'var(--accent-danger)' };
    }
}

export default function StipendPage() {
    const tierInfo = getTierInfo(stipendData.tier);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Stipend Status</h1>
                <p className={styles.subtitle}>Your weekly stipend is action-gated, not time-based</p>
            </header>

            {/* Status Card */}
            <div className={`card ${styles.statusCard}`}>
                <div className={styles.statusHeader}>
                    {stipendData.eligible ? (
                        <div className={styles.eligibleBadge}>
                            <Check size={20} />
                            <span>Eligible</span>
                        </div>
                    ) : (
                        <div className={styles.ineligibleBadge}>
                            <AlertTriangle size={20} />
                            <span>Not Eligible</span>
                        </div>
                    )}
                    <div className={styles.tierBadge} style={{ color: tierInfo.color }}>
                        <TrendingUp size={16} />
                        <span>{tierInfo.label}</span>
                    </div>
                </div>

                <div className={styles.amountSection}>
                    <div className={styles.nextPayout}>
                        <span className={styles.payoutLabel}>Next Payout</span>
                        <span className={styles.payoutAmount}>₦{stipendData.amount.toLocaleString()}</span>
                    </div>
                    <div className={styles.payoutDate}>
                        <Calendar size={16} />
                        <span>{stipendData.nextPayoutDate.toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    </div>
                </div>

                {/* Momentum Bar */}
                <div className={styles.momentumSection}>
                    <div className={styles.momentumHeader}>
                        <Zap size={16} />
                        <span>Current Momentum</span>
                        <strong>{stipendData.momentum}</strong>
                    </div>
                    <div className={styles.momentumBar}>
                        <div
                            className={styles.momentumFill}
                            style={{ width: `${Math.min(stipendData.momentum, 100)}%` }}
                        />
                        <div className={styles.threshold} style={{ left: '50%' }}>
                            <span>50</span>
                        </div>
                        <div className={styles.threshold} style={{ left: '100%' }}>
                            <span>100</span>
                        </div>
                    </div>
                    <p className={styles.momentumHint}>
                        Keep momentum above 50 to stay eligible. Higher momentum = larger stipend.
                    </p>
                </div>
            </div>

            <div className={styles.panels}>
                {/* Requirements */}
                <div className={`card ${styles.requirementsCard}`}>
                    <h2>Eligibility Requirements</h2>
                    <div className={styles.requirementsList}>
                        {requirements.map((req, index) => (
                            <div key={index} className={styles.requirement}>
                                <div className={styles.reqStatus}>
                                    {req.met ? (
                                        <Check size={16} className={styles.checkIcon} />
                                    ) : (
                                        <AlertTriangle size={16} className={styles.warnIcon} />
                                    )}
                                    <span>{req.label}</span>
                                </div>
                                <span className={styles.reqValue}>{req.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* History */}
                <div className={`card ${styles.historyCard}`}>
                    <h2>Payout History</h2>
                    <div className={styles.historyList}>
                        {stipendHistory.map((payout) => (
                            <div key={payout.id} className={styles.historyItem}>
                                <div className={styles.historyIcon}>
                                    <Wallet size={16} />
                                </div>
                                <div className={styles.historyDetails}>
                                    <span className={styles.historyAmount}>
                                        ₦{payout.amount.toLocaleString()}
                                    </span>
                                    <span className={styles.historyDate}>
                                        {payout.date.toLocaleDateString()}
                                    </span>
                                </div>
                                <span className={`badge badge-success`}>Paid</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Info Box */}
            <div className={styles.infoBox}>
                <Info size={20} />
                <div>
                    <strong>Stipend is Infrastructure, Not Welfare</strong>
                    <p>Your stipend exists to remove barriers so you can focus on skill development and income generation. It's earned through daily action, not waiting.</p>
                </div>
            </div>
        </div>
    );
}
