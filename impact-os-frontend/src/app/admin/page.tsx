'use client';

import { FileText, Users, DollarSign, Target } from 'lucide-react';
import styles from './page.module.css';

// Mock data - will connect to backend API
const stats = {
    applicants: { total: 156, pending: 23, admitted: 98, conditional: 12, rejected: 23 },
    users: { total: 98, active: 87, paused: 11 },
    income: { pendingReviews: 8, totalVerifiedUSD: 12500, totalRecords: 156 },
    missions: { pendingReviews: 5, completedToday: 34, activeAssignments: 72 },
};

const recentActivity = [
    { type: 'application', description: 'Adaeze Okonkwo - ADMITTED', time: '2 min ago' },
    { type: 'income', description: 'Chidi Eze verified $85', time: '15 min ago' },
    { type: 'mission', description: 'Ngozi Ibe completed "First Client"', time: '32 min ago' },
    { type: 'application', description: 'Emeka Nnamdi - CONDITIONAL', time: '1 hr ago' },
    { type: 'income', description: 'Amara Okoro verified $150', time: '2 hr ago' },
];

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'application': return <FileText size={16} />;
        case 'income': return <DollarSign size={16} />;
        case 'mission': return <Target size={16} />;
        default: return <FileText size={16} />;
    }
};

export default function AdminDashboard() {
    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1>Admin Dashboard</h1>
                <p className={styles.subtitle}>Overview of Impact OS operations</p>
            </header>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statIcon}><FileText size={20} /></span>
                        <span className={styles.statLabel}>Applicants</span>
                    </div>
                    <div className={styles.statValue}>{stats.applicants.total}</div>
                    <div className={styles.statBreakdown}>
                        <span className="badge badge-warning">{stats.applicants.pending} pending</span>
                        <span className="badge badge-success">{stats.applicants.admitted} admitted</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statIcon}><Users size={20} /></span>
                        <span className={styles.statLabel}>Active Users</span>
                    </div>
                    <div className={styles.statValue}>{stats.users.active}</div>
                    <div className={styles.statBreakdown}>
                        <span className="badge badge-gold">{stats.users.paused} paused</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statIcon}><DollarSign size={20} /></span>
                        <span className={styles.statLabel}>Verified Income</span>
                    </div>
                    <div className={styles.statValue}>₦{stats.income.totalVerifiedUSD.toLocaleString()}</div>
                    <div className={styles.statBreakdown}>
                        <span className="badge badge-warning">{stats.income.pendingReviews} pending</span>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <span className={styles.statIcon}><Target size={20} /></span>
                        <span className={styles.statLabel}>Missions Today</span>
                    </div>
                    <div className={styles.statValue}>{stats.missions.completedToday}</div>
                    <div className={styles.statBreakdown}>
                        <span className="badge badge-gold">{stats.missions.activeAssignments} active</span>
                    </div>
                </div>
            </div>

            {/* Activity & Quick Actions */}
            <div className={styles.panels}>
                <div className={`card ${styles.activityPanel}`}>
                    <h2>Recent Activity</h2>
                    <div className={styles.activityList}>
                        {recentActivity.map((item, idx) => (
                            <div key={idx} className={styles.activityItem}>
                                <span className={styles.activityIcon}>
                                    {getActivityIcon(item.type)}
                                </span>
                                <div className={styles.activityContent}>
                                    <span>{item.description}</span>
                                    <span className={styles.activityTime}>{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`card ${styles.quickActions}`}>
                    <h2>Quick Actions</h2>
                    <div className={styles.actionButtons}>
                        <button className="btn btn-primary">Review Applicants ({stats.applicants.pending})</button>
                        <button className="btn btn-secondary">Approve Income ({stats.income.pendingReviews})</button>
                        <button className="btn btn-secondary">Review Missions ({stats.missions.pendingReviews})</button>
                        <button className="btn btn-secondary">Trigger Daily Missions</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
