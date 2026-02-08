'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Check, X, Clock, AlertTriangle, Loader2, HeartHandshake, ArrowUpCircle, LayoutGrid, LayoutList } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/admin/Toast';
import styles from './page.module.css';

// Types
interface SupportRequest {
    id: string;
    type: 'DATA' | 'TRANSPORT' | 'TOOLS' | 'COUNSELLING';
    status: 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED';
    userId: string;
    userName: string;
    userPsnLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
    missionTitle?: string;
    justification?: string;
    metadata?: Record<string, string>;
    amount?: number;
    createdAt: string;
    updatedAt: string;
}

// Mock data
const mockRequests: SupportRequest[] = [
    {
        id: 'sr-1',
        type: 'DATA',
        status: 'PENDING',
        userId: 'user-1',
        userName: 'Adaeze Okoro',
        userPsnLevel: 'HIGH',
        missionTitle: 'First Client Outreach',
        metadata: {
            phoneNumber: '08012345678',
            networkProvider: 'MTN',
            dataAmount: '2GB',
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sr-2',
        type: 'TRANSPORT',
        status: 'PENDING',
        userId: 'user-2',
        userName: 'Chukwuemeka Eze',
        userPsnLevel: 'MEDIUM',
        missionTitle: 'Portfolio Review',
        metadata: {
            destination: 'Ikeja, Lagos',
            travelDate: '2026-01-31',
            purpose: 'Client meeting',
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sr-3',
        type: 'COUNSELLING',
        status: 'APPROVED',
        userId: 'user-3',
        userName: 'Funke Adeyemi',
        missionTitle: 'Skill Assessment',
        metadata: {
            topic: 'PERSONAL',
            triedSolutions: 'Tried discussing with peers but need professional guidance',
        },
        amount: 0,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: 'sr-4',
        type: 'TOOLS',
        status: 'COMPLETED',
        userId: 'user-4',
        userName: 'Ibrahim Musa',
        missionTitle: 'Build Portfolio',
        metadata: {
            toolName: 'Figma Pro',
            purpose: 'Design portfolio website mockups',
        },
        amount: 5000,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
];

const TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
    DATA: { label: 'Data/Internet', emoji: '📶' },
    TRANSPORT: { label: 'Transport', emoji: '🚌' },
    TOOLS: { label: 'Tools/Software', emoji: '💻' },
    COUNSELLING: { label: 'Mentorship', emoji: '💬' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Check }> = {
    PENDING: { label: 'Pending', color: 'var(--gold-warm)', icon: Clock },
    APPROVED: { label: 'Approved', color: 'var(--accent-success)', icon: Check },
    DENIED: { label: 'Denied', color: 'var(--accent-danger)', icon: X },
    COMPLETED: { label: 'Completed', color: 'var(--text-secondary)', icon: Check },
};

export default function AdminSupportQueuePage() {
    const { showToast } = useToast();
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED'>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
    const [actionModal, setActionModal] = useState<'approve' | 'deny' | 'escalate' | null>(null);
    const [actionAmount, setActionAmount] = useState('');
    const [actionNote, setActionNote] = useState('');
    const [escalationPriority, setEscalationPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
    const [processing, setProcessing] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const token = localStorage.getItem('auth_token');
                const response = await fetch(`${API_URL}/support-request/admin/all`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setRequests(data);
                } else if (process.env.NODE_ENV !== 'production') {
                    // Only use mock data in development
                    setRequests(mockRequests);
                } else {
                    setRequests([]);
                }
            } catch (error) {
                console.error('Failed to fetch support requests:', error);
                if (process.env.NODE_ENV !== 'production') {
                    setRequests(mockRequests);
                } else {
                    setRequests([]);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const filteredRequests = requests.filter(r => {
        if (filter !== 'ALL' && r.status !== filter) return false;
        if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
        if (searchQuery && !r.userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const pendingCount = requests.filter(r => r.status === 'PENDING').length;

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setProcessing(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        setRequests(prev => prev.map(r =>
            r.id === selectedRequest.id
                ? { ...r, status: 'APPROVED', amount: parseFloat(actionAmount) || 0, updatedAt: new Date().toISOString() }
                : r
        ));

        setProcessing(false);
        setActionModal(null);
        setSelectedRequest(null);
        setActionAmount('');
        setActionNote('');
    };

    const handleDeny = async () => {
        if (!selectedRequest) return;
        setProcessing(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        setRequests(prev => prev.map(r =>
            r.id === selectedRequest.id
                ? { ...r, status: 'DENIED', updatedAt: new Date().toISOString() }
                : r
        ));

        setProcessing(false);
        setActionModal(null);
        setSelectedRequest(null);
        setActionNote('');
    };

    const handleMarkComplete = async (request: SupportRequest) => {
        setProcessing(true);

        await new Promise(resolve => setTimeout(resolve, 300));

        setRequests(prev => prev.map(r =>
            r.id === request.id
                ? { ...r, status: 'COMPLETED', updatedAt: new Date().toISOString() }
                : r
        ));

        setProcessing(false);
    };

    const handleEscalate = async () => {
        if (!selectedRequest || !actionNote.trim()) return;
        setProcessing(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // In real implementation, this would create an Escalation record
        console.log('Escalation created:', {
            requestId: selectedRequest.id,
            priority: escalationPriority,
            reason: actionNote,
        });

        // Show success feedback
        showToast('success', 'Request escalated to supervisor');

        setProcessing(false);
        setActionModal(null);
        setSelectedRequest(null);
        setActionNote('');
        setEscalationPriority('NORMAL');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1><HeartHandshake size={24} /> Support Queue</h1>
                    <p className={styles.subtitle}>
                        {pendingCount > 0 ? (
                            <><strong>{pendingCount}</strong> requests awaiting review</>
                        ) : (
                            'All caught up!'
                        )}
                    </p>
                </div>
            </header>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.filterGroup}>
                    <Filter size={16} />
                    <Select
                        value={filter}
                        onChange={(val) => setFilter(val as typeof filter)}
                        options={[
                            { value: 'ALL', label: 'All Status' },
                            { value: 'PENDING', label: 'Pending' },
                            { value: 'APPROVED', label: 'Approved' },
                            { value: 'DENIED', label: 'Denied' },
                            { value: 'COMPLETED', label: 'Completed' },
                        ]}
                    />

                    <Select
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                            { value: 'ALL', label: 'All Types' },
                            { value: 'DATA', label: 'Data' },
                            { value: 'TRANSPORT', label: 'Transport' },
                            { value: 'TOOLS', label: 'Tools' },
                            { value: 'COUNSELLING', label: 'Counselling' },
                        ]}
                    />
                </div>

                {/* View Toggle */}
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        <LayoutList size={18} />
                    </button>
                </div>
            </div>

            {/* Request List */}
            {loading ? (
                <div className={styles.loadingState}>
                    <Loader2 size={24} className={styles.spinner} />
                    <p>Loading requests...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className={styles.emptyState}>
                    <HeartHandshake size={48} />
                    <h3>No requests found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            ) : (
                <div className={`${styles.requestList} ${viewMode === 'grid' ? styles.gridView : styles.listView}`}>
                    {filteredRequests.map((request) => {
                        const typeInfo = TYPE_LABELS[request.type];
                        const statusInfo = STATUS_CONFIG[request.status];
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={request.id}
                                className={`${styles.requestCard} ${request.status === 'PENDING' ? styles.pending : ''}`}
                            >
                                <div className={styles.requestHeader}>
                                    <div className={styles.requestType}>
                                        <span className={styles.typeEmoji}>{typeInfo.emoji}</span>
                                        <span>{typeInfo.label}</span>
                                    </div>
                                    <span className={styles.requestTime}>{formatDate(request.createdAt)}</span>
                                </div>

                                <div className={styles.requestBody}>
                                    <div className={styles.userInfo}>
                                        <span className={styles.userName}>{request.userName}</span>
                                        {request.userPsnLevel && (
                                            <span className={`${styles.psnBadge} ${styles[`psn${request.userPsnLevel}`]}`}>
                                                PSN: {request.userPsnLevel}
                                            </span>
                                        )}
                                    </div>
                                    {request.missionTitle && (
                                        <p className={styles.missionLink}>Mission: {request.missionTitle}</p>
                                    )}

                                    {/* Type-specific details */}
                                    {request.metadata && (
                                        <div className={styles.metadataGrid}>
                                            {Object.entries(request.metadata).map(([key, value]) => (
                                                <div key={key} className={styles.metadataItem}>
                                                    <span className={styles.metadataKey}>
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </span>
                                                    <span className={styles.metadataValue}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.requestFooter}>
                                    <span className={styles.statusBadge} style={{ color: statusInfo.color }}>
                                        <StatusIcon size={14} />
                                        {statusInfo.label}
                                        {request.amount !== undefined && request.amount > 0 && (
                                            <span className={styles.amountTag}>₦{request.amount.toLocaleString()}</span>
                                        )}
                                    </span>

                                    <div className={styles.actions}>
                                        {request.status === 'PENDING' && (
                                            <>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setActionModal('approve');
                                                    }}
                                                >
                                                    <Check size={16} /> Approve
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.denyBtn}`}
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setActionModal('deny');
                                                    }}
                                                >
                                                    <X size={16} /> Deny
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.escalateBtn}`}
                                                    onClick={() => {
                                                        setSelectedRequest(request);
                                                        setActionModal('escalate');
                                                    }}
                                                >
                                                    <ArrowUpCircle size={16} /> Escalate
                                                </button>
                                            </>
                                        )}
                                        {request.status === 'APPROVED' && (
                                            <button
                                                className={`${styles.actionBtn} ${styles.completeBtn}`}
                                                onClick={() => handleMarkComplete(request)}
                                                disabled={processing}
                                            >
                                                <Check size={16} /> Mark Disbursed
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Approve Modal */}
            {actionModal === 'approve' && selectedRequest && (
                <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Approve Support Request</h2>
                        <p className={styles.modalSubtitle}>
                            {selectedRequest.userName} &mdash; {TYPE_LABELS[selectedRequest.type].label}
                        </p>

                        <div className={styles.modalField}>
                            <label>Amount to Disburse (₦)</label>
                            <input
                                type="number"
                                value={actionAmount}
                                onChange={(e) => setActionAmount(e.target.value)}
                                placeholder="e.g., 2000"
                            />
                        </div>

                        <div className={styles.modalField}>
                            <label>Internal Note (optional)</label>
                            <textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                placeholder="Any notes for the audit log..."
                                rows={2}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setActionModal(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.confirmApproveBtn}
                                onClick={handleApprove}
                                disabled={processing}
                            >
                                {processing ? <Loader2 size={16} className={styles.spinner} /> : <Check size={16} />}
                                Confirm Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deny Modal */}
            {actionModal === 'deny' && selectedRequest && (
                <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Deny Support Request</h2>
                        <p className={styles.modalSubtitle}>
                            {selectedRequest.userName} &mdash; {TYPE_LABELS[selectedRequest.type].label}
                        </p>

                        <div className={styles.warningBox}>
                            <AlertTriangle size={16} />
                            <span>The participant will see a generic message. Do not share specific reasons.</span>
                        </div>

                        <div className={styles.modalField}>
                            <label>Internal Reason (required)</label>
                            <textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                placeholder="Reason for denial (for audit log only)..."
                                rows={3}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setActionModal(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.confirmDenyBtn}
                                onClick={handleDeny}
                                disabled={processing || !actionNote.trim()}
                            >
                                {processing ? <Loader2 size={16} className={styles.spinner} /> : <X size={16} />}
                                Confirm Denial
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Escalate Modal */}
            {actionModal === 'escalate' && selectedRequest && (
                <div className={styles.modalOverlay} onClick={() => setActionModal(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2>Escalate to Supervisor</h2>
                        <p className={styles.modalSubtitle}>
                            {selectedRequest.userName} &mdash; {TYPE_LABELS[selectedRequest.type].label}
                        </p>

                        <div className={styles.modalField}>
                            <label>Priority</label>
                            <Select
                                value={escalationPriority}
                                onChange={(val) => setEscalationPriority(val as typeof escalationPriority)}
                                options={[
                                    { value: 'NORMAL', label: 'Normal' },
                                    { value: 'HIGH', label: 'High' },
                                    { value: 'URGENT', label: 'Urgent' },
                                ]}
                            />
                        </div>

                        <div className={styles.modalField}>
                            <label>Reason for Escalation *</label>
                            <textarea
                                value={actionNote}
                                onChange={(e) => setActionNote(e.target.value)}
                                placeholder="Why does this need supervisor review?"
                                rows={3}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setActionModal(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.confirmEscalateBtn}
                                onClick={handleEscalate}
                                disabled={processing || !actionNote.trim()}
                            >
                                {processing ? <Loader2 size={16} className={styles.spinner} /> : <ArrowUpCircle size={16} />}
                                Send to Supervisor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
