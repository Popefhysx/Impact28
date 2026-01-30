'use client';

import { useState } from 'react';
import { Zap, Check, AlertTriangle, TrendingUp, HelpCircle, FileText, Clock, Info, HeartHandshake, Plus } from 'lucide-react';
import { SupportRequestCard } from '@/components/dashboard/SupportRequestCard';
import styles from './page.module.css';

// Mock data - participants never see amounts
const supportData = {
    eligible: true,
    momentum: 78,
    momentumRequired: 50,
    daysActive: 23,
    identityLevel: 'L2_SKILLED',
    hasPendingRequest: false,
};

// Support request history - no amounts shown to participants
const supportHistory = [
    { id: '1', type: 'DATA', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), status: 'COMPLETED', mission: 'First Client Outreach' },
    { id: '2', type: 'TRANSPORT', date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), status: 'COMPLETED', mission: 'Portfolio Review' },
    { id: '3', type: 'TOOLS', date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), status: 'COMPLETED', mission: 'Tool Setup' },
];

const requirements = [
    { label: 'Momentum above 50', met: true, value: `${supportData.momentum}/50` },
    { label: 'Account active', met: true, value: 'Active' },
    { label: 'Weekly check-in complete', met: true, value: 'Completed' },
    { label: 'Linked to active mission', met: true, value: 'Yes' },
];

function getSupportTypeLabel(type: string) {
    switch (type) {
        case 'DATA':
            return '📶 Data/Internet';
        case 'TRANSPORT':
            return '🚌 Transport';
        case 'TOOLS':
            return '💻 Tools/Software';
        case 'COUNSELLING':
            return '💬 Mentor Session';
        default:
            return '📋 Other';
    }
}

function getStatusLabel(status: string) {
    switch (status) {
        case 'PENDING':
            return { label: 'Under Review', color: 'var(--gold-warm)' };
        case 'APPROVED':
            return { label: 'On the Way', color: 'var(--accent-success)' };
        case 'COMPLETED':
            return { label: 'Delivered', color: 'var(--accent-success)' };
        case 'DENIED':
            return { label: 'Not Available', color: 'var(--text-secondary)' };
        default:
            return { label: status, color: 'var(--text-secondary)' };
    }
}

export default function SupportAccessPage() {
    const [showRequestForm, setShowRequestForm] = useState(false);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Support Access</h1>
                <p className={styles.subtitle}>Request help when something's blocking your mission progress</p>
            </header>

            {/* Status Card */}
            <div className={`card ${styles.statusCard}`}>
                <div className={styles.statusHeader}>
                    {supportData.eligible ? (
                        <div className={styles.eligibleBadge}>
                            <Check size={20} />
                            <span>Access Active</span>
                        </div>
                    ) : (
                        <div className={styles.ineligibleBadge}>
                            <AlertTriangle size={20} />
                            <span>Access Paused</span>
                        </div>
                    )}
                </div>

                {supportData.eligible && !showRequestForm && (
                    <div className={styles.supportCta}>
                        <HeartHandshake size={24} />
                        <div>
                            <p>Need help completing a mission?</p>
                            <span className={styles.ctaHint}>Request data, transport, or tools</span>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowRequestForm(true)}
                        >
                            <Plus size={16} />
                            New Request
                        </button>
                    </div>
                )}

                {showRequestForm && (
                    <div className={styles.requestFormContainer}>
                        <SupportRequestCard
                            onClose={() => setShowRequestForm(false)}
                            embedded={true}
                        />
                    </div>
                )}

                {/* Momentum Bar */}
                <div className={styles.momentumSection}>
                    <div className={styles.momentumHeader}>
                        <Zap size={16} />
                        <span>Current Momentum</span>
                        <strong>{supportData.momentum}</strong>
                    </div>
                    <div className={styles.momentumBar}>
                        <div
                            className={styles.momentumFill}
                            style={{ width: `${Math.min(supportData.momentum, 100)}%` }}
                        />
                        <div className={styles.threshold} style={{ left: '50%' }}>
                            <span>50</span>
                        </div>
                    </div>
                    <p className={styles.momentumHint}>
                        Keep momentum above 50 to stay eligible for support requests.
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

                {/* History - No amounts shown */}
                <div className={`card ${styles.historyCard}`}>
                    <h2>Support History</h2>
                    {supportHistory.length > 0 ? (
                        <div className={styles.historyList}>
                            {supportHistory.map((request) => {
                                const statusInfo = getStatusLabel(request.status);
                                return (
                                    <div key={request.id} className={styles.historyItem}>
                                        <div className={styles.historyIcon}>
                                            <FileText size={16} />
                                        </div>
                                        <div className={styles.historyDetails}>
                                            <span className={styles.historyType}>
                                                {getSupportTypeLabel(request.type)}
                                            </span>
                                            <span className={styles.historyMission}>
                                                {request.mission}
                                            </span>
                                            <span className={styles.historyDate}>
                                                {request.date.toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span
                                            className={styles.historyStatus}
                                            style={{ color: statusInfo.color }}
                                        >
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyHistory}>
                            <Clock size={32} />
                            <p>No support requests yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className={styles.infoBox}>
                <Info size={20} />
                <div>
                    <strong>Support is Behavior-Gated</strong>
                    <p>Support helps remove blockers so you can complete missions. It's earned through daily action and linked to specific missions — not given automatically.</p>
                </div>
            </div>
        </div>
    );
}
