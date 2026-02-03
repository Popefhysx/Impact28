'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Users, DollarSign, Target, MessageSquareQuote, Loader2, AlertCircle, Handshake } from 'lucide-react';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface DashboardStats {
    applicants: { total: number; pending: number; admitted: number; conditional: number; rejected: number; scoring: number };
    users: { total: number; active: number; paused: number; byLevel: Record<string, number> };
    income: { pendingReviews: number; totalVerifiedUSD: number; totalRecords: number };
    missions: { pendingReviews: number; completedToday: number; activeAssignments: number };
}

interface RecentActivity {
    type: 'application' | 'income' | 'mission';
    description: string;
    timestamp: string;
    applicantId?: string;
    userId?: string;
}

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'application': return <FileText size={16} />;
        case 'income': return <DollarSign size={16} />;
        case 'mission': return <Target size={16} />;
        default: return <FileText size={16} />;
    }
};

const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activity, setActivity] = useState<RecentActivity[]>([]);
    const [pendingTestimonials, setPendingTestimonials] = useState(0);
    const [pendingPartners, setPendingPartners] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const [statsRes, activityRes, testimonialsRes, partnersRes] = await Promise.all([
                    fetch(`${API_BASE}/admin/dashboard`),
                    fetch(`${API_BASE}/admin/activity?limit=10`),
                    fetch(`${API_BASE}/testimonials/admin/all`),
                    fetch(`${API_BASE}/partners`),
                ]);

                if (statsRes.ok) {
                    setStats(await statsRes.json());
                } else {
                    console.warn('Failed to fetch dashboard stats');
                }

                if (activityRes.ok) {
                    setActivity(await activityRes.json());
                } else {
                    console.warn('Failed to fetch activity');
                }

                if (testimonialsRes.ok) {
                    const testimonials = await testimonialsRes.json();
                    setPendingTestimonials(testimonials.filter((t: { status: string }) => t.status === 'PENDING').length);
                }

                if (partnersRes.ok) {
                    const partners = await partnersRes.json();
                    setPendingPartners(partners.filter((p: { status: string }) => p.status === 'PENDING').length);
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loadingState}>
                    <Loader2 size={32} className={styles.spinner} />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.errorState}>
                    <AlertCircle size={32} />
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1>Admin Dashboard</h1>
                <p className={styles.subtitle}>Overview of Impact OS operations</p>
            </header>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard} onClick={() => router.push('/admin/applicants')} style={{ cursor: 'pointer' }}>
                    <div className={styles.statHeader}>
                        <span className={styles.statIcon}><FileText size={20} /></span>
                        <span className={styles.statLabel}>Applicants</span>
                    </div>
                    <div className={styles.statValue}>{stats?.applicants.total || 0}</div>
                    <div className={styles.statBreakdown}>
                        {(stats?.applicants.pending || 0) > 0 && (
                            <span className="badge badge-warning">{stats?.applicants.pending} pending</span>
                        )}
                        <span className="badge badge-success">{stats?.applicants.admitted || 0} admitted</span>
                    </div>
                </div>

                <div className={styles.statCard} onClick={() => router.push('/admin/participants')} style={{ cursor: 'pointer' }}>
                    <div className={styles.statHeader}>
                        <span className={styles.statIcon}><Users size={20} /></span>
                        <span className={styles.statLabel}>Active Users</span>
                    </div>
                    <div className={styles.statValue}>{stats?.users.active || 0}</div>
                    <div className={styles.statBreakdown}>
                        {(stats?.users.paused || 0) > 0 && (
                            <span className="badge badge-gold">{stats?.users.paused} paused</span>
                        )}
                    </div>
                </div>

                <div className={styles.statCard} onClick={() => router.push('/admin/income')} style={{ cursor: 'pointer' }}>
                    <div className={styles.statHeader}>
                        <span className={styles.statIcon}><DollarSign size={20} /></span>
                        <span className={styles.statLabel}>Verified Income</span>
                    </div>
                    <div className={styles.statValue}>₦{(stats?.income.totalVerifiedUSD || 0).toLocaleString()}</div>
                    <div className={styles.statBreakdown}>
                        {(stats?.income.pendingReviews || 0) > 0 && (
                            <span className="badge badge-warning">{stats?.income.pendingReviews} pending</span>
                        )}
                    </div>
                </div>

                <div className={styles.statCard} onClick={() => router.push('/admin/missions')} style={{ cursor: 'pointer' }}>
                    <div className={styles.statHeader}>
                        <span className={styles.statIcon}><Target size={20} /></span>
                        <span className={styles.statLabel}>Missions Today</span>
                    </div>
                    <div className={styles.statValue}>{stats?.missions.completedToday || 0}</div>
                    <div className={styles.statBreakdown}>
                        <span className="badge badge-gold">{stats?.missions.activeAssignments || 0} active</span>
                    </div>
                </div>
            </div>

            {/* Activity & Quick Actions */}
            <div className={styles.panels}>
                <div className={`card ${styles.activityPanel}`}>
                    <h2>Recent Activity</h2>
                    {activity.length === 0 ? (
                        <div className={styles.emptyActivity}>
                            <p>No recent activity</p>
                        </div>
                    ) : (
                        <div className={styles.activityList}>
                            {activity.map((item, idx) => (
                                <div key={idx} className={styles.activityItem}>
                                    <span className={styles.activityIcon}>
                                        {getActivityIcon(item.type)}
                                    </span>
                                    <div className={styles.activityContent}>
                                        <span>{item.description}</span>
                                        <span className={styles.activityTime}>{formatTimeAgo(item.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={`card ${styles.quickActions}`}>
                    <h2>Quick Actions</h2>
                    <div className={styles.actionButtons}>
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push('/admin/applicants?status=PENDING')}
                            disabled={(stats?.applicants.pending || 0) === 0}
                        >
                            Review Applicants ({stats?.applicants.pending || 0})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/income')}
                            disabled={(stats?.income.pendingReviews || 0) === 0}
                        >
                            Approve Income ({stats?.income.pendingReviews || 0})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/missions/reviews')}
                            disabled={(stats?.missions.pendingReviews || 0) === 0}
                        >
                            Review Missions ({stats?.missions.pendingReviews || 0})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/testimonials')}
                            disabled={pendingTestimonials === 0}
                        >
                            <MessageSquareQuote size={16} /> Review Testimonials ({pendingTestimonials})
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => router.push('/admin/partners')}
                            disabled={pendingPartners === 0}
                        >
                            <Handshake size={16} /> Review Partners ({pendingPartners})
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
