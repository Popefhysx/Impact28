'use client';

import { useState, useEffect } from 'react';
import { Check, X, Eye, ExternalLink, Clock, User, Banknote, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/admin/Toast';
import styles from './page.module.css';

// Types for income verification
interface Income {
    id: string;
    userId: string;
    userName: string;
    amount: number;
    currency: string;
    source: string;
    platform: string;
    description: string;
    proofUrl: string;
    status: string;
    submittedAt: Date;
}

// Mock data for development only
const mockPendingIncomes: Income[] = [
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
    const { showToast } = useToast();
    const [pendingIncomes, setPendingIncomes] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncome, setSelectedIncome] = useState<string | null>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        const fetchIncomes = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_BASE}/income/admin/pending`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    // Convert date strings back to Date objects
                    const incomes = (data || []).map((income: Income & { submittedAt: string }) => ({
                        ...income,
                        submittedAt: new Date(income.submittedAt),
                    }));
                    setPendingIncomes(incomes.length > 0 ? incomes : (process.env.NODE_ENV !== 'production' ? mockPendingIncomes : []));
                } else if (process.env.NODE_ENV !== 'production') {
                    setPendingIncomes(mockPendingIncomes);
                } else {
                    setPendingIncomes([]);
                }
            } catch (error) {
                console.error('Failed to fetch incomes:', error);
                if (process.env.NODE_ENV !== 'production') {
                    setPendingIncomes(mockPendingIncomes);
                } else {
                    setPendingIncomes([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchIncomes();
    }, [API_BASE]);

    const handleApprove = async (incomeId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE}/income/admin/${incomeId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setPendingIncomes(prev => prev.filter(i => i.id !== incomeId));
            } else {
                showToast('error', `Failed to approve income ${incomeId}`);
            }
        } catch (error) {
            console.error('Approve failed:', error);
            showToast('error', `Error approving income ${incomeId}`);
        }
    };

    const handleReject = async (incomeId: string, reason?: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API_BASE}/income/admin/${incomeId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason }),
            });

            if (response.ok) {
                setPendingIncomes(prev => prev.filter(i => i.id !== incomeId));
            } else {
                showToast('error', `Failed to reject income ${incomeId}`);
            }
        } catch (error) {
            console.error('Reject failed:', error);
            showToast('error', `Error rejecting income ${incomeId}`);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Loading income verifications...</p>
                </div>
            </div>
        );
    }

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
