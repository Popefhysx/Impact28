'use client';

import { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui';
import styles from '../settings.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface Phase {
    id: string;
    name: string;
    slug: string;
    order: number;
    durationDays: number;
    description?: string;
    isActive: boolean;
}

export default function PhasesPage() {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingPhase, setEditingPhase] = useState<Phase | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [durationDays, setDurationDays] = useState(7);
    const [description, setDescription] = useState('');

    const fetchPhases = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/phases`);
            if (res.ok) {
                const data = await res.json();
                setPhases(data);
            }
        } catch (error) {
            console.error('Failed to fetch phases:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPhases();
    }, [fetchPhases]);

    const openNewModal = () => {
        setEditingPhase(null);
        setName('');
        setSlug('');
        setDurationDays(7);
        setDescription('');
        setShowModal(true);
    };

    const openEditModal = (phase: Phase) => {
        setEditingPhase(phase);
        setName(phase.name);
        setSlug(phase.slug);
        setDurationDays(phase.durationDays);
        setDescription(phase.description || '');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!name.trim() || (!editingPhase && !slug.trim())) return;
        setSaving(true);

        try {
            const url = editingPhase
                ? `${API_BASE}/settings/phases/${editingPhase.id}`
                : `${API_BASE}/settings/phases`;

            const payload = editingPhase
                ? { name, durationDays, description }
                : { name, slug: slug.toUpperCase().replace(/\s+/g, '_'), order: phases.length + 1, durationDays, description };

            const res = await fetch(url, {
                method: editingPhase ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await fetchPhases();
                setShowModal(false);
            }
        } catch (error) {
            console.error('Failed to save phase:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this phase?')) return;

        try {
            const res = await fetch(`${API_BASE}/settings/phases/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchPhases();
            }
        } catch (error) {
            console.error('Failed to delete phase:', error);
        }
    };

    const movePhase = async (index: number, direction: 'up' | 'down') => {
        const newPhases = [...phases];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= phases.length) return;

        [newPhases[index], newPhases[newIndex]] = [newPhases[newIndex], newPhases[index]];
        setPhases(newPhases);

        try {
            await fetch(`${API_BASE}/settings/phases/reorder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds: newPhases.map(p => p.id) }),
            });
        } catch (error) {
            console.error('Failed to reorder:', error);
            await fetchPhases(); // Revert on error
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <PageHeader title="Phases" subtitle="Manage program phases" />
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={32} className={styles.spinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title="Phases"
                subtitle="Configure program phases and progression timeline"
            />

            <div className={styles.toolbar}>
                <button className={styles.primaryBtn} onClick={openNewModal}>
                    <Plus size={16} />
                    New Phase
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '50px' }}>Order</th>
                            <th>Name</th>
                            <th>Slug</th>
                            <th>Duration</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {phases.map((phase, index) => (
                            <tr key={phase.id}>
                                <td className={styles.orderCell}>
                                    <span className={styles.orderBadge}>{phase.order}</span>
                                </td>
                                <td className={styles.nameCell}>
                                    <Layers size={16} />
                                    {phase.name}
                                </td>
                                <td>
                                    <code className={styles.slugCode}>{phase.slug}</code>
                                </td>
                                <td>{phase.durationDays} days</td>
                                <td className={styles.descCell}>{phase.description || '—'}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => movePhase(index, 'up')}
                                            disabled={index === 0}
                                            title="Move Up"
                                        >
                                            <ArrowUp size={14} />
                                        </button>
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => movePhase(index, 'down')}
                                            disabled={index === phases.length - 1}
                                            title="Move Down"
                                        >
                                            <ArrowDown size={14} />
                                        </button>
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => openEditModal(phase)}
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className={`${styles.iconBtn} ${styles.danger}`}
                                            onClick={() => handleDelete(phase.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {phases.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No phases configured. Create phases to define program progression.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingPhase ? 'Edit Phase' : 'New Phase'}
            >
                <div className={styles.modalForm}>
                    <div className={styles.formField}>
                        <label>Phase Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Week 1 - Foundation"
                        />
                    </div>
                    {!editingPhase && (
                        <div className={styles.formField}>
                            <label>Slug (Identifier) *</label>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                                placeholder="e.g., WEEK_1"
                            />
                            <span className={styles.hint}>Unique identifier, uppercase with underscores</span>
                        </div>
                    )}
                    <div className={styles.formField}>
                        <label>Duration (days)</label>
                        <input
                            type="number"
                            value={durationDays}
                            onChange={(e) => setDurationDays(parseInt(e.target.value) || 7)}
                            min={1}
                        />
                    </div>
                    <div className={styles.formField}>
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this phase..."
                            rows={3}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button
                            className={styles.primaryBtn}
                            onClick={handleSave}
                            disabled={!name.trim() || (!editingPhase && !slug.trim()) || saving}
                        >
                            {saving ? <Loader2 size={16} className={styles.spinner} /> : null}
                            {editingPhase ? 'Save Changes' : 'Create Phase'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
