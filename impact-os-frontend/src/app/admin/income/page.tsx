'use client';

import { useState } from 'react';
import { Check, X, Eye, ExternalLink, Clock, User, Banknote, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

// Mock data for income verification queue
const pendingIncomes = [
    {
        id: 'income-001',
        userId: 'user-001',
        userName: 'Adaeze Okonkwo',
        amount: 25000,
        currency: 'NGN',
        source: 'FREELANCE',
        platform: 'Fiverr',
        description: 'Logo design project for local business',
        proofUrl: '/proof/income-001.jpg',
        status: 'UNDER_REVIEW',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
        id: 'income-002',
        userId: 'user-002',
        userName: 'Chidi Eze',
        amount: 85000,
        currency: 'NGN',
        source: 'CLIENT_WORK',
        platform: 'Direct',
        description: 'E-commerce website development',
        proofUrl: '/proof/income-002.jpg',
        status: 'UNDER_REVIEW',
        submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
        id: 'income-003',
        userId: 'user-004',
        userName: 'Emeka Nnamdi',
        amount: 15000,
        currency: 'NGN',
        source: 'CONTENT_PAYMENT',
        platform: 'YouTube',
        description: 'Video editing for content creator',
        proofUrl: '/proof/income-003.jpg',
        status: 'UNDER_REVIEW',
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
];

const sourceLabels: Record<string, string> = {
    'FREELANCE': 'Freelance',
    'CLIENT_WORK': 'Client Work',
    'RETAINER': 'Retainer',
    'CONTENT_PAYMENT': 'Content',
    'OTHER': 'Other',
};

function formatTimeAgo(date: Date) {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

export default function IncomeVerificationPage() {
    const [selectedIncome, setSelectedIncome] = useState<string | null>(null);

    const handleApprove = (incomeId: string) => {
        // TODO: API call to approve income
        console.log('Approving income:', incomeId);
        alert(`Income ${incomeId} approved!`);
    };

    const handleReject = (incomeId: string, reason?: string) => {
        // TODO: API call to reject income
        console.log('Rejecting income:', incomeId, reason);
        alert(`Income ${incomeId} rejected.`);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Income Verification</h1>
                <p className={styles.subtitle}>{pendingIncomes.length} pending reviews</p>
            </header>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.stat}>
                    <Clock size={16} />
                    <span>Avg. Review Time: 4 hours</span>
                </div>
                <div className={styles.stat}>
                    <Banknote size={16} />
                    <span>Today: ₦125,000 verified</span>
                </div>
            </div>

            {/* Queue */}
            <div className={styles.queue}>
                {pendingIncomes.map((income) => (
                    <div key={income.id} className={`card ${styles.incomeCard}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.userInfo}>
                                <div className={styles.avatar}>
                                    <User size={16} />
                                </div>
                                <div>
                                    <span className={styles.userName}>{income.userName}</span>
                                    <span className={styles.submittedAt}>{formatTimeAgo(income.submittedAt)}</span>
                                </div>
                            </div>
                            <div className={styles.amount}>
                                ₦{income.amount.toLocaleString()}
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.detailsGrid}>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Source</span>
                                    <span className={styles.detailValue}>{sourceLabels[income.source]}</span>
                                </div>
                                <div className={styles.detail}>
                                    <span className={styles.detailLabel}>Platform</span>
                                    <span className={styles.detailValue}>{income.platform}</span>
                                </div>
                            </div>
                            <p className={styles.description}>{income.description}</p>
                        </div>

                        <div className={styles.cardActions}>
                            <button
                                className={`btn ${styles.proofBtn}`}
                                onClick={() => setSelectedIncome(income.id)}
                            >
                                <Eye size={16} /> View Proof
                            </button>
                            <div className={styles.actionButtons}>
                                <button
                                    className={`btn btn-success ${styles.approveBtn}`}
                                    onClick={() => handleApprove(income.id)}
                                >
                                    <Check size={16} /> Approve
                                </button>
                                <button
                                    className={`btn btn-danger ${styles.rejectBtn}`}
                                    onClick={() => handleReject(income.id)}
                                >
                                    <X size={16} /> Reject
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {pendingIncomes.length === 0 && (
                <div className={`card ${styles.emptyState}`}>
                    <Check size={48} />
                    <h3>All caught up!</h3>
                    <p>No pending income verifications.</p>
                </div>
            )}

            {/* Guidelines */}
            <div className={styles.guidelines}>
                <AlertCircle size={18} />
                <div>
                    <strong>Verification Guidelines</strong>
                    <ul>
                        <li>Proof must show the amount clearly (screenshot of payment, bank statement, etc.)</li>
                        <li>Platform name should match the proof</li>
                        <li>Only skill-based income qualifies (no winnings, gifts, or internal payments)</li>
                        <li>Reject with reason if something seems off</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
