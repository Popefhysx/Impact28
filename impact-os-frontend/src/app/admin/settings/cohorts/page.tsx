'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui';
import { useToast } from '@/components/admin/Toast';
import styles from '../settings.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Cohort {
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    capacity: number;
    isActive: boolean;
    _count?: {
        users: number;
        applicants: number;
    };
}

export default function CohortsPage() {
    const { showToast } = useToast();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [capacity, setCapacity] = useState(20);

    const fetchCohorts = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/cohorts`);
            if (res.ok) {
                const data = await res.json();
                setCohorts(data);
            }
        } catch (error) {
            console.error('Failed to fetch cohorts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCohorts();
    }, [fetchCohorts]);

    const openNewModal = () => {
        setEditingCohort(null);
        setName('');
        setStartDate('');
        setEndDate('');
        setCapacity(20);
        setShowModal(true);
    };

    const openEditModal = (cohort: Cohort) => {
        setEditingCohort(cohort);
        setName(cohort.name);
        setStartDate(cohort.startDate.split('T')[0]);
        setEndDate(cohort.endDate ? cohort.endDate.split('T')[0] : '');
        setCapacity(cohort.capacity);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!name.trim() || !startDate) return;
        setSaving(true);

        try {
            const payload = {
                name,
                startDate,
                endDate: endDate || undefined,
                capacity,
            };

            const url = editingCohort
                ? `${API_BASE}/settings/cohorts/${editingCohort.id}`
                : `${API_BASE}/settings/cohorts`;

            const res = await fetch(url, {
                method: editingCohort ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await fetchCohorts();
                setShowModal(false);
            }
        } catch (error) {
            console.error('Failed to save cohort:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this cohort?')) return;

        try {
            const res = await fetch(`${API_BASE}/settings/cohorts/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await fetchCohorts();
            } else {
                const data = await res.json();
                showToast('error', data.message || 'Cannot delete cohort with enrolled users');
            }
        } catch (error) {
            console.error('Failed to delete cohort:', error);
        }
    };

    const getStatus = (cohort: Cohort): 'ACTIVE' | 'UPCOMING' | 'COMPLETED' => {
        const now = new Date();
        const start = new Date(cohort.startDate);
        const end = cohort.endDate ? new Date(cohort.endDate) : null;

        if (end && now > end) return 'COMPLETED';
        if (now >= start) return 'ACTIVE';
        return 'UPCOMING';
    };

    const getStatusBadge = (status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED') => {
        const classes = {
            ACTIVE: styles.badgeActive,
            UPCOMING: styles.badgeUpcoming,
            COMPLETED: styles.badgeCompleted,
        };
        return <span className={`${styles.badge} ${classes[status]}`}>{status}</span>;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <PageHeader title="Cohorts" subtitle="Manage program cohorts" />
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={32} className={styles.spinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title="Cohorts"
                subtitle="Manage program cohorts and enrollment periods"
            />

            <div className={styles.toolbar}>
                <button className={styles.primaryBtn} onClick={openNewModal}>
                    <Plus size={16} />
                    New Cohort
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Capacity</th>
                            <th>Enrolled</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cohorts.map(cohort => {
                            const enrolled = cohort._count?.users || 0;
                            const status = getStatus(cohort);
                            return (
                                <tr key={cohort.id}>
                                    <td className={styles.nameCell}>
                                        <Users size={16} />
                                        {cohort.name}
                                    </td>
                                    <td>{new Date(cohort.startDate).toLocaleDateString()}</td>
                                    <td>{cohort.endDate ? new Date(cohort.endDate).toLocaleDateString() : '—'}</td>
                                    <td>{cohort.capacity}</td>
                                    <td>
                                        <span className={styles.enrolledBadge}>
                                            {enrolled}/{cohort.capacity}
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(status)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.iconBtn}
                                                onClick={() => openEditModal(cohort)}
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                className={`${styles.iconBtn} ${styles.danger}`}
                                                onClick={() => handleDelete(cohort.id)}
                                                title="Delete"
                                                disabled={enrolled > 0}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {cohorts.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No cohorts yet. Create your first cohort to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCohort ? 'Edit Cohort' : 'New Cohort'}
            >
                <div className={styles.modalForm}>
                    <div className={styles.formField}>
                        <label>Cohort Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Cohort Gamma"
                        />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formField}>
                            <label>Start Date *</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className={styles.formField}>
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.formField}>
                        <label>Capacity</label>
                        <input
                            type="number"
                            value={capacity}
                            onChange={(e) => setCapacity(parseInt(e.target.value) || 20)}
                            min={1}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button
                            className={styles.primaryBtn}
                            onClick={handleSave}
                            disabled={!name.trim() || !startDate || saving}
                        >
                            {saving ? <Loader2 size={16} className={styles.spinner} /> : null}
                            {editingCohort ? 'Save Changes' : 'Create Cohort'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
