'use client';

import { useState } from 'react';
import { DollarSign, Upload, Check, Clock, X, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import styles from './page.module.css';

// Mock data
const incomeRecords = [
    {
        id: '1',
        amount: 25000,
        currency: 'NGN',
        source: 'FREELANCE',
        platform: 'Fiverr',
        description: 'Logo design for local business',
        status: 'VERIFIED',
        earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        verifiedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
        id: '2',
        amount: 15000,
        currency: 'NGN',
        source: 'CLIENT_WORK',
        platform: 'Direct',
        description: 'Social media graphics package',
        status: 'UNDER_REVIEW',
        earnedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
];

const stats = {
    totalVerified: 25000,
    pendingReview: 15000,
    totalRecords: 2,
};

function getStatusBadge(status: string) {
    switch (status) {
        case 'VERIFIED':
            return <span className={`badge badge-success`}><Check size={12} /> Verified</span>;
        case 'UNDER_REVIEW':
            return <span className={`badge badge-warning`}><Clock size={12} /> Under Review</span>;
        case 'REJECTED':
            return <span className={`badge badge-danger`}><X size={12} /> Rejected</span>;
        default:
            return <span className={`badge`}>{status}</span>;
    }
}

export default function IncomePage() {
    const [showForm, setShowForm] = useState(false);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>My Income</h1>
                    <p className={styles.subtitle}>Track and verify your earnings</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Upload size={16} /> Submit Income
                </button>
            </header>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                    <DollarSign size={24} className={styles.statIcon} />
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>₦{stats.totalVerified.toLocaleString()}</span>
                        <span className={styles.statLabel}>Total Verified</span>
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <Clock size={24} className={styles.pendingIcon} />
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>₦{stats.pendingReview.toLocaleString()}</span>
                        <span className={styles.statLabel}>Pending Review</span>
                    </div>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <FileText size={24} className={styles.recordsIcon} />
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalRecords}</span>
                        <span className={styles.statLabel}>Total Records</span>
                    </div>
                </div>
            </div>

            {/* Submission Form */}
            {showForm && (
                <div className={`card ${styles.formCard}`}>
                    <h2>Submit New Income</h2>
                    <p className={styles.formHint}>
                        Submit proof of income earned from your skill. Must be real, skill-based, and externally verifiable.
                    </p>
                    <form className={styles.form}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Amount (NGN)</label>
                                <input type="number" placeholder="e.g., 25000" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Source</label>
                                <select>
                                    <option value="FREELANCE">Freelance Platform</option>
                                    <option value="CLIENT_WORK">Direct Client</option>
                                    <option value="RETAINER">Retainer</option>
                                    <option value="CONTENT_PAYMENT">Content Payment</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Platform/Client Name</label>
                            <input type="text" placeholder="e.g., Fiverr, Upwork, Client Name" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea placeholder="Describe the work you did" rows={3} />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Proof (Screenshot/Receipt)</label>
                            <div className={styles.uploadArea}>
                                <Upload size={24} />
                                <span>Click or drag to upload proof</span>
                                <small>PNG, JPG, PDF up to 5MB</small>
                            </div>
                        </div>
                        <div className={styles.formActions}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Submit for Verification
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Income Records */}
            <div className={`card ${styles.recordsCard}`}>
                <h2>Income Records</h2>
                <div className={styles.recordsList}>
                    {incomeRecords.map((record) => (
                        <div key={record.id} className={styles.recordItem}>
                            <div className={styles.recordMain}>
                                <div className={styles.recordAmount}>
                                    ₦{record.amount.toLocaleString()}
                                </div>
                                <div className={styles.recordDetails}>
                                    <span className={styles.recordDesc}>{record.description}</span>
                                    <div className={styles.recordMeta}>
                                        <span>{record.platform}</span>
                                        <span>•</span>
                                        <span>{record.earnedAt.toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.recordStatus}>
                                {getStatusBadge(record.status)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Box */}
            <div className={styles.infoBox}>
                <AlertCircle size={20} />
                <div>
                    <strong>Earn Before Day 90</strong>
                    <p>To graduate as a Catalyst, you must earn verified income from your skill before Day 90. Mock clients and internal payments do not count.</p>
                </div>
            </div>
        </div>
    );
}
