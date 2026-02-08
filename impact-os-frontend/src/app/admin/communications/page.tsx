'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Mail, AlertTriangle, Check, Clock, Loader2, RefreshCw, X, Send, PenSquare } from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import styles from './page.module.css';

// Types
interface CommunicationLog {
    id: string;
    triggeredBy: string;
    triggerSource: 'INTAKE' | 'ADMISSION' | 'AUTH' | 'STAFF' | 'SYSTEM' | 'MANUAL';
    templateType: string;
    subject: string;
    recipientEmail: string;
    recipientName: string | null;
    status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
    sentAt: string | null;
    failedAt: string | null;
    failureReason: string | null;
    createdAt: string;
}

interface Stats {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    pending: number;
}

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
    INTAKE: { label: 'Intake', color: 'var(--accent-info)' },
    ADMISSION: { label: 'Admission', color: 'var(--accent-success)' },
    AUTH: { label: 'Auth', color: 'var(--gold-warm)' },
    STAFF: { label: 'Staff', color: 'var(--accent-purple, #9b59b6)' },
    SYSTEM: { label: 'System', color: 'var(--text-secondary)' },
    MANUAL: { label: 'Manual', color: 'var(--navy-deep)' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Check }> = {
    QUEUED: { label: 'Queued', color: 'var(--text-secondary)', icon: Clock },
    SENT: { label: 'Sent', color: 'var(--accent-info)', icon: Send },
    DELIVERED: { label: 'Delivered', color: 'var(--accent-success)', icon: Check },
    FAILED: { label: 'Failed', color: 'var(--accent-danger)', icon: X },
    BOUNCED: { label: 'Bounced', color: 'var(--accent-warning)', icon: AlertTriangle },
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Mock data for development
const mockStats: Stats = {
    total: 47,
    sent: 35,
    delivered: 32,
    failed: 3,
    pending: 9,
};

const mockLogs: CommunicationLog[] = [
    {
        id: 'comm-001',
        triggeredBy: 'SYSTEM',
        triggerSource: 'INTAKE',
        templateType: 'APPLICATION_RECEIVED',
        subject: 'Application Received - Cycle 28',
        recipientEmail: 'adaeze@example.com',
        recipientName: 'Adaeze Okonkwo',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        failedAt: null,
        failureReason: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'comm-002',
        triggeredBy: 'SYSTEM',
        triggerSource: 'ADMISSION',
        templateType: 'OFFER_LETTER',
        subject: 'Congratulations! You have been accepted',
        recipientEmail: 'chidi@example.com',
        recipientName: 'Chidi Eze',
        status: 'DELIVERED',
        sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        failedAt: null,
        failureReason: null,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'comm-003',
        triggeredBy: 'admin@impactos.ng',
        triggerSource: 'MANUAL',
        templateType: 'MANUAL_EMAIL',
        subject: 'Reminder: Complete your onboarding',
        recipientEmail: 'ngozi@example.com',
        recipientName: 'Ngozi Ibe',
        status: 'SENT',
        sentAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        failedAt: null,
        failureReason: null,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'comm-004',
        triggeredBy: 'SYSTEM',
        triggerSource: 'AUTH',
        templateType: 'PASSWORD_RESET',
        subject: 'Reset your password',
        recipientEmail: 'tunde@example.com',
        recipientName: 'Tunde Adeyemi',
        status: 'FAILED',
        sentAt: null,
        failedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        failureReason: 'Invalid email address',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'comm-005',
        triggeredBy: 'SYSTEM',
        triggerSource: 'STAFF',
        templateType: 'WEEKLY_UPDATE',
        subject: 'Weekly Progress Report',
        recipientEmail: 'staff@impactos.ng',
        recipientName: null,
        status: 'QUEUED',
        sentAt: null,
        failedAt: null,
        failureReason: null,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
        id: 'comm-006',
        triggeredBy: 'SYSTEM',
        triggerSource: 'SYSTEM',
        templateType: 'MISSION_REMINDER',
        subject: 'Mission deadline approaching',
        recipientEmail: 'participant@example.com',
        recipientName: 'Sample Participant',
        status: 'BOUNCED',
        sentAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        failedAt: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
        failureReason: 'Mailbox does not exist',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    },
];

export default function CommunicationsPage() {
    const [logs, setLogs] = useState<CommunicationLog[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'failures'>('all');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [sourceFilter, setSourceFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/communications/stats`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            } else if (process.env.NODE_ENV !== 'production') {
                setStats(mockStats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
            if (process.env.NODE_ENV !== 'production') {
                setStats(mockStats);
            }
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('pageSize', '20');

            if (activeTab === 'failures') {
                params.set('status', 'FAILED');
            } else if (statusFilter !== 'ALL') {
                params.set('status', statusFilter);
            }

            if (sourceFilter !== 'ALL') {
                params.set('source', sourceFilter);
            }

            if (searchQuery) {
                params.set('search', searchQuery);
            }

            const res = await fetch(`${API_BASE}/api/admin/communications?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.data?.length > 0 ? data.data : (process.env.NODE_ENV !== 'production' ? mockLogs : []));
                setTotalPages(data.totalPages || 1);
            } else if (process.env.NODE_ENV !== 'production') {
                setLogs(mockLogs);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            if (process.env.NODE_ENV !== 'production') {
                setLogs(mockLogs);
                setTotalPages(1);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [page, activeTab, statusFilter, sourceFilter, searchQuery]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatTemplateType = (type: string) => {
        return type
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className={styles.container}>
            {/* Page Header with Section Tabs */}
            <PageHeader
                tabs={[
                    {
                        key: 'templates',
                        label: 'Email Templates',
                        icon: <PenSquare size={18} />,
                        href: '/admin/email-templates',
                    },
                    {
                        key: 'log',
                        label: 'Email Log',
                        icon: <Mail size={18} />,
                        active: true,
                    },
                ]}
                actions={
                    <Link href="/admin/communications/compose" className={styles.composeBtn}>
                        <PenSquare size={16} />
                        Compose
                    </Link>
                }
            />

            {/* Stats Cards */}
            {stats && (
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.total}`}>
                            <Send size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.total}</span>
                            <span className={styles.statLabel}>Total Sent</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.delivered}`}>
                            <Check size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.delivered}</span>
                            <span className={styles.statLabel}>Delivered</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.failed}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.failed}</span>
                            <span className={styles.statLabel}>Failed</span>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.pending}`}>
                            <Clock size={24} />
                        </div>
                        <div className={styles.statContent}>
                            <span className={styles.statValue}>{stats.pending}</span>
                            <span className={styles.statLabel}>Pending</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar - Tabs + Filters on same row */}
            <div className={styles.toolbar}>
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
                        onClick={() => { setActiveTab('all'); setPage(1); }}
                    >
                        <Mail size={16} /> All Emails
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'failures' ? styles.activeTab : ''}`}
                        onClick={() => { setActiveTab('failures'); setPage(1); }}
                    >
                        <AlertTriangle size={16} /> Failures
                        {stats && stats.failed > 0 && (
                            <span className={styles.tabBadge}>{stats.failed}</span>
                        )}
                    </button>
                </div>

                <div className={styles.filters}>
                    <div className={styles.searchBox}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <Filter size={16} />
                        {activeTab === 'all' && (
                            <Select
                                value={statusFilter}
                                onChange={(val) => { setStatusFilter(val); setPage(1); }}
                                options={[
                                    { value: 'ALL', label: 'All Status' },
                                    { value: 'QUEUED', label: 'Queued' },
                                    { value: 'SENT', label: 'Sent' },
                                    { value: 'DELIVERED', label: 'Delivered' },
                                    { value: 'FAILED', label: 'Failed' },
                                ]}
                            />
                        )}

                        <Select
                            value={sourceFilter}
                            onChange={(val) => { setSourceFilter(val); setPage(1); }}
                            options={[
                                { value: 'ALL', label: 'All Sources' },
                                { value: 'INTAKE', label: 'Intake' },
                                { value: 'ADMISSION', label: 'Admission' },
                                { value: 'AUTH', label: 'Auth' },
                                { value: 'STAFF', label: 'Staff' },
                                { value: 'SYSTEM', label: 'System' },
                            ]}
                        />
                    </div>

                    <button className={styles.refreshBtn} onClick={fetchLogs} title="Refresh">
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Email List */}
            {loading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={24} className={styles.spinner} />
                    <p>Loading emails...</p>
                </div>
            ) : logs.length === 0 ? (
                <div className={styles.emptyState}>
                    <Mail size={48} />
                    <h3>No emails found</h3>
                    <p>{activeTab === 'failures' ? 'No failed emails to display' : 'Adjust your filters or check back later'}</p>
                </div>
            ) : (
                <>
                    <div className={styles.emailList}>
                        {logs.map((log) => {
                            const statusInfo = STATUS_CONFIG[log.status];
                            const sourceInfo = SOURCE_LABELS[log.triggerSource] || { label: log.triggerSource, color: 'var(--text-secondary)' };
                            const StatusIcon = statusInfo.icon;

                            return (
                                <div key={log.id} className={`${styles.emailCard} ${log.status === 'FAILED' ? styles.failed : ''}`}>
                                    <div className={styles.emailHeader}>
                                        <div className={styles.emailMeta}>
                                            <span
                                                className={styles.sourceBadge}
                                                style={{ backgroundColor: `${sourceInfo.color}20`, color: sourceInfo.color }}
                                            >
                                                {sourceInfo.label}
                                            </span>
                                            <span className={styles.templateType}>
                                                {formatTemplateType(log.templateType)}
                                            </span>
                                        </div>
                                        <span className={styles.emailTime}>{formatDate(log.createdAt)}</span>
                                    </div>

                                    <div className={styles.emailBody}>
                                        <h4 className={styles.emailSubject}>{log.subject}</h4>
                                        <div className={styles.emailRecipient}>
                                            <span className={styles.recipientName}>{log.recipientName || 'Unknown'}</span>
                                            <span className={styles.recipientEmail}>&lt;{log.recipientEmail}&gt;</span>
                                        </div>
                                    </div>

                                    <div className={styles.emailFooter}>
                                        <span className={styles.statusBadge} style={{ color: statusInfo.color }}>
                                            <StatusIcon size={14} />
                                            {statusInfo.label}
                                            {log.sentAt && log.status !== 'FAILED' && (
                                                <span className={styles.sentTime}> • {formatDate(log.sentAt)}</span>
                                            )}
                                        </span>

                                        {log.failureReason && (
                                            <span className={styles.failureReason} title={log.failureReason}>
                                                <AlertTriangle size={12} />
                                                {log.failureReason.substring(0, 50)}...
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
