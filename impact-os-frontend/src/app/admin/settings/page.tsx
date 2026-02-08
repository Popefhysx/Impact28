'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Loader2, Users, Plus, Pencil, Trash2,
    Layers, ArrowUp, ArrowDown, Calendar, Clock, CalendarDays, Info
} from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui';
import { useToast } from '@/components/admin/Toast';
import styles from './settings.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
// One-Date system: derive all milestones from a single Program Start Date
function deriveMilestones(startDateStr: string) {
    if (!startDateStr) return null;
    const start = new Date(startDateStr + 'T00:00:00');
    const addDays = (d: Date, n: number) => {
        const r = new Date(d);
        r.setDate(r.getDate() + n);
        return r;
    };
    const fmt = (d: Date) => d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    return {
        applicationsOpen: { date: addDays(start, -28), label: 'Applications Open', formula: 'Start − 28 days' },
        applicationsClose: { date: addDays(start, -14), label: 'Applications Close', formula: 'Start − 14 days' },
        orientation: { date: addDays(start, -7), label: 'Orientation', formula: 'Start − 7 days' },
        day1: { date: start, label: 'Day 1 (Program Start)', formula: 'Start date' },
        trainingEnd: { date: addDays(start, 42), label: 'Technical Training End', formula: 'Start + 42 days' },
        graduation: { date: addDays(start, 90), label: 'Day 90 (Graduation)', formula: 'Start + 90 days' },
        fmt,
    };
}

interface Cohort {
    id: string;
    name: string;
    startDate: string;
    endDate?: string;
    capacity: number;
    isActive: boolean;
    _count?: { users: number; applicants: number };
}

interface Phase {
    id: string;
    name: string;
    slug: string;
    order: number;
    durationDays: number;
    description?: string;
    isActive: boolean;
}

type EventType = 'ORIENTATION' | 'DEADLINE' | 'MILESTONE' | 'SESSION' | 'OTHER';

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    time?: string;
    type: EventType;
    description?: string;
    cohortId?: string;
    cohort?: { id: string; name: string };
}

const eventTypeColors: Record<EventType, string> = {
    ORIENTATION: '#4CAF50',
    DEADLINE: '#F44336',
    MILESTONE: '#2196F3',
    SESSION: '#FF9800',
    OTHER: '#9E9E9E',
};

type SettingsTab = 'cohorts' | 'phases' | 'calendar';

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('cohorts');

    const tabs: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
        { key: 'cohorts', label: 'Cohorts', icon: <Users size={15} /> },
        { key: 'phases', label: 'Phases', icon: <Layers size={15} /> },
        { key: 'calendar', label: 'Calendar', icon: <Calendar size={15} /> },
    ];

    return (
        <div className={styles.container}>
            <PageHeader
                subtitle="Program lifecycle and scheduling"
                tabs={tabs.map(t => ({
                    key: t.key,
                    label: t.label,
                    icon: t.icon,
                    active: activeTab === t.key,
                    onClick: () => setActiveTab(t.key),
                }))}
            />

            {activeTab === 'cohorts' && <CohortsTab />}
            {activeTab === 'phases' && <PhasesTab />}
            {activeTab === 'calendar' && <CalendarTab />}
        </div>
    );
}

// ============================================================================
// COHORTS TAB — One-Date System
// ============================================================================
function CohortsTab() {
    const { showToast } = useToast();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
    const [name, setName] = useState('');
    const [programStartDate, setProgramStartDate] = useState('');
    const [capacity, setCapacity] = useState(20);

    // Auto-derive milestones from the single start date
    const milestones = useMemo(() => deriveMilestones(programStartDate), [programStartDate]);

    const fetchCohorts = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/cohorts`);
            if (res.ok) setCohorts(await res.json());
        } catch (error) { console.error('Failed to fetch cohorts:', error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCohorts(); }, [fetchCohorts]);

    const openNewModal = () => {
        setEditingCohort(null); setName(''); setProgramStartDate(''); setCapacity(20); setShowModal(true);
    };

    const openEditModal = (cohort: Cohort) => {
        setEditingCohort(cohort); setName(cohort.name);
        setProgramStartDate(cohort.startDate.split('T')[0]);
        setCapacity(cohort.capacity); setShowModal(true);
    };

    const handleSave = async () => {
        if (!name.trim() || !programStartDate) return;
        setSaving(true);
        // Compute end date as Start + 90 days
        const endDate = new Date(programStartDate + 'T00:00:00');
        endDate.setDate(endDate.getDate() + 90);
        const endDateStr = endDate.toISOString().split('T')[0];
        try {
            const url = editingCohort ? `${API_BASE}/settings/cohorts/${editingCohort.id}` : `${API_BASE}/settings/cohorts`;
            const res = await fetch(url, {
                method: editingCohort ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, startDate: programStartDate, endDate: endDateStr, capacity }),
            });
            if (res.ok) { await fetchCohorts(); setShowModal(false); }
        } catch (error) { console.error('Failed to save cohort:', error); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this cohort?')) return;
        try {
            const res = await fetch(`${API_BASE}/settings/cohorts/${id}`, { method: 'DELETE' });
            if (res.ok) { await fetchCohorts(); } else { const data = await res.json(); showToast('error', data.message || 'Cannot delete cohort with enrolled users'); }
        } catch (error) { console.error('Failed to delete cohort:', error); }
    };

    const getStatus = (cohort: Cohort): 'ACTIVE' | 'UPCOMING' | 'COMPLETED' => {
        const now = new Date(); const start = new Date(cohort.startDate); const end = cohort.endDate ? new Date(cohort.endDate) : null;
        if (end && now > end) return 'COMPLETED';
        if (now >= start) return 'ACTIVE';
        return 'UPCOMING';
    };

    const getStatusBadge = (status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED') => {
        const classes = { ACTIVE: styles.badgeActive, UPCOMING: styles.badgeUpcoming, COMPLETED: styles.badgeCompleted };
        return <span className={`${styles.badge} ${classes[status]}`}>{status}</span>;
    };

    if (loading) return <div className={styles.loading}><Loader2 size={24} className={styles.spinner} /> Loading cohorts...</div>;

    return (
        <>
            <div className={styles.toolbar}>
                <button className={styles.primaryBtn} onClick={openNewModal}><Plus size={16} /> New Cohort</button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead><tr><th>Name</th><th>Program Start</th><th>Graduation</th><th>Capacity</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        {cohorts.map(cohort => {
                            const enrolled = cohort._count?.users || 0;
                            return (
                                <tr key={cohort.id}>
                                    <td className={styles.nameCell}><Users size={16} />{cohort.name}</td>
                                    <td className={styles.dateCell}><CalendarDays size={14} />{new Date(cohort.startDate).toLocaleDateString()}</td>
                                    <td className={styles.dateCell}><CalendarDays size={14} />{cohort.endDate ? new Date(cohort.endDate).toLocaleDateString() : '—'}</td>
                                    <td>{cohort.capacity}</td>
                                    <td><span className={styles.enrolledBadge}>{enrolled}/{cohort.capacity}</span></td>
                                    <td>{getStatusBadge(getStatus(cohort))}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.iconBtn} onClick={() => openEditModal(cohort)} title="Edit"><Pencil size={14} /></button>
                                            <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(cohort.id)} title="Delete" disabled={enrolled > 0}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {cohorts.length === 0 && (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No cohorts yet. Create your first cohort to get started.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCohort ? 'Edit Cohort' : 'New Cohort'}>
                <div className={styles.modalForm}>
                    <div className={styles.formField}>
                        <label>Cohort Name *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Project 3:10" />
                    </div>
                    <div className={styles.formField}>
                        <label>Program Start Date *</label>
                        <input type="date" value={programStartDate} onChange={(e) => setProgramStartDate(e.target.value)} />
                        <span className={styles.hint}>One date drives everything — all milestones are auto-calculated</span>
                    </div>
                    <div className={styles.formField}>
                        <label>Capacity</label>
                        <input type="number" value={capacity} onChange={(e) => setCapacity(parseInt(e.target.value) || 20)} min={1} />
                    </div>

                    {/* ── Derived Milestones Preview ──────────────── */}
                    {milestones && (
                        <div className={styles.milestonesPreview}>
                            <div className={styles.milestonesHeader}>
                                <Info size={14} />
                                <span>Auto-Calculated 16-Week Schedule</span>
                            </div>
                            <div className={styles.milestonesList}>
                                {[
                                    milestones.applicationsOpen,
                                    milestones.applicationsClose,
                                    milestones.orientation,
                                    milestones.day1,
                                    milestones.trainingEnd,
                                    milestones.graduation,
                                ].map((m) => (
                                    <div key={m.label} className={`${styles.milestoneItem} ${m.label.includes('Day 1') ? styles.milestoneHighlight : ''}`}>
                                        <span className={styles.milestoneLabel}>{m.label}</span>
                                        <span className={styles.milestoneDate}>{milestones.fmt(m.date)}</span>
                                        <span className={styles.milestoneFormula}>{m.formula}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.modalActions}>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                        <button className={styles.primaryBtn} onClick={handleSave} disabled={!name.trim() || !programStartDate || saving}>
                            {saving ? <Loader2 size={16} className={styles.spinner} /> : null}
                            {editingCohort ? 'Save Changes' : 'Create Cohort'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

// ============================================================================
// PHASES TAB
// ============================================================================
function PhasesTab() {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [durationDays, setDurationDays] = useState(7);
    const [description, setDescription] = useState('');

    const fetchPhases = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/phases`);
            if (res.ok) setPhases(await res.json());
        } catch (error) { console.error('Failed to fetch phases:', error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPhases(); }, [fetchPhases]);

    const openNewModal = () => {
        setEditingPhase(null); setName(''); setSlug(''); setDurationDays(7); setDescription(''); setShowModal(true);
    };

    const openEditModal = (phase: Phase) => {
        setEditingPhase(phase); setName(phase.name); setSlug(phase.slug);
        setDurationDays(phase.durationDays); setDescription(phase.description || ''); setShowModal(true);
    };

    const handleSave = async () => {
        if (!name.trim() || (!editingPhase && !slug.trim())) return;
        setSaving(true);
        try {
            const url = editingPhase ? `${API_BASE}/settings/phases/${editingPhase.id}` : `${API_BASE}/settings/phases`;
            const payload = editingPhase
                ? { name, durationDays, description }
                : { name, slug: slug.toUpperCase().replace(/\s+/g, '_'), order: phases.length + 1, durationDays, description };
            const res = await fetch(url, {
                method: editingPhase ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) { await fetchPhases(); setShowModal(false); }
        } catch (error) { console.error('Failed to save phase:', error); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this phase?')) return;
        try {
            const res = await fetch(`${API_BASE}/settings/phases/${id}`, { method: 'DELETE' });
            if (res.ok) await fetchPhases();
        } catch (error) { console.error('Failed to delete phase:', error); }
    };

    const movePhase = async (index: number, direction: 'up' | 'down') => {
        const newPhases = [...phases];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= phases.length) return;
        [newPhases[index], newPhases[newIndex]] = [newPhases[newIndex], newPhases[index]];
        setPhases(newPhases);
        try {
            await fetch(`${API_BASE}/settings/phases/reorder`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds: newPhases.map(p => p.id) }),
            });
        } catch (error) { console.error('Failed to reorder:', error); await fetchPhases(); }
    };

    if (loading) return <div className={styles.loading}><Loader2 size={24} className={styles.spinner} /> Loading phases...</div>;

    return (
        <>
            <div className={styles.toolbar}>
                <button className={styles.primaryBtn} onClick={openNewModal}><Plus size={16} /> New Phase</button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead><tr><th style={{ width: '50px' }}>Order</th><th>Name</th><th>Slug</th><th>Duration</th><th>Description</th><th>Actions</th></tr></thead>
                    <tbody>
                        {phases.map((phase, index) => (
                            <tr key={phase.id}>
                                <td className={styles.orderCell}><span className={styles.orderBadge}>{phase.order}</span></td>
                                <td className={styles.nameCell}><Layers size={16} />{phase.name}</td>
                                <td><code className={styles.slugCode}>{phase.slug}</code></td>
                                <td>{phase.durationDays} days</td>
                                <td className={styles.descCell}>{phase.description || '—'}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <button className={styles.iconBtn} onClick={() => movePhase(index, 'up')} disabled={index === 0} title="Move Up"><ArrowUp size={14} /></button>
                                        <button className={styles.iconBtn} onClick={() => movePhase(index, 'down')} disabled={index === phases.length - 1} title="Move Down"><ArrowDown size={14} /></button>
                                        <button className={styles.iconBtn} onClick={() => openEditModal(phase)} title="Edit"><Pencil size={14} /></button>
                                        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(phase.id)} title="Delete"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {phases.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No phases configured. Create phases to define program progression.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPhase ? 'Edit Phase' : 'New Phase'}>
                <div className={styles.modalForm}>
                    <div className={styles.formField}>
                        <label>Phase Name *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Week 1 - Foundation" />
                    </div>
                    {!editingPhase && (
                        <div className={styles.formField}>
                            <label>Slug (Identifier) *</label>
                            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.toUpperCase().replace(/\s+/g, '_'))} placeholder="e.g., WEEK_1" />
                            <span className={styles.hint}>Unique identifier, uppercase with underscores</span>
                        </div>
                    )}
                    <div className={styles.formField}>
                        <label>Duration (days)</label>
                        <input type="number" value={durationDays} onChange={(e) => setDurationDays(parseInt(e.target.value) || 7)} min={1} />
                    </div>
                    <div className={styles.formField}>
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this phase..." rows={3} />
                    </div>
                    <div className={styles.modalActions}>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                        <button className={styles.primaryBtn} onClick={handleSave} disabled={!name.trim() || (!editingPhase && !slug.trim()) || saving}>
                            {saving ? <Loader2 size={16} className={styles.spinner} /> : null}
                            {editingPhase ? 'Save Changes' : 'Create Phase'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

// ============================================================================
// CALENDAR TAB
// ============================================================================
function CalendarTab() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState<EventType>('SESSION');
    const [description, setDescription] = useState('');

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/calendar`);
            if (res.ok) setEvents(await res.json());
        } catch (error) { console.error('Failed to fetch events:', error); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const openNewModal = () => {
        setEditingEvent(null); setTitle(''); setDate(''); setTime(''); setType('SESSION'); setDescription(''); setShowModal(true);
    };

    const openEditModal = (event: CalendarEvent) => {
        setEditingEvent(event); setTitle(event.title); setDate(event.date.split('T')[0]);
        setTime(event.time || ''); setType(event.type); setDescription(event.description || ''); setShowModal(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !date) return;
        setSaving(true);
        try {
            const url = editingEvent ? `${API_BASE}/settings/calendar/${editingEvent.id}` : `${API_BASE}/settings/calendar`;
            const res = await fetch(url, {
                method: editingEvent ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, date, time: time || undefined, type, description: description || undefined }),
            });
            if (res.ok) { await fetchEvents(); setShowModal(false); }
        } catch (error) { console.error('Failed to save event:', error); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        try {
            const res = await fetch(`${API_BASE}/settings/calendar/${id}`, { method: 'DELETE' });
            if (res.ok) await fetchEvents();
        } catch (error) { console.error('Failed to delete event:', error); }
    };

    if (loading) return <div className={styles.loading}><Loader2 size={24} className={styles.spinner} /> Loading calendar...</div>;

    return (
        <>
            <div className={styles.toolbar}>
                <button className={styles.primaryBtn} onClick={openNewModal}><Plus size={16} /> Add Event</button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead><tr><th>Event</th><th>Date</th><th>Time</th><th>Type</th><th>Description</th><th>Actions</th></tr></thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event.id}>
                                <td className={styles.nameCell}><Calendar size={16} />{event.title}</td>
                                <td className={styles.dateCell}><Calendar size={14} />{new Date(event.date).toLocaleDateString()}</td>
                                <td className={styles.timeCell}>{event.time ? <><Clock size={14} />{event.time}</> : '—'}</td>
                                <td><span className={styles.typeBadge} style={{ background: `${eventTypeColors[event.type]}20`, color: eventTypeColors[event.type] }}>{event.type}</span></td>
                                <td className={styles.descCell}>{event.description || '—'}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <button className={styles.iconBtn} onClick={() => openEditModal(event)} title="Edit"><Pencil size={14} /></button>
                                        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(event.id)} title="Delete"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No events scheduled. Add events to create the program calendar.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEvent ? 'Edit Event' : 'New Event'}>
                <div className={styles.modalForm}>
                    <div className={styles.formField}>
                        <label>Event Title *</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Orientation Session" />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formField}>
                            <label>Date *</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className={styles.formField}>
                            <label>Time</label>
                            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                    </div>
                    <div className={styles.formField}>
                        <label>Event Type</label>
                        <div className={styles.typePills}>
                            {(['ORIENTATION', 'DEADLINE', 'MILESTONE', 'SESSION', 'OTHER'] as EventType[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    className={`${styles.typePill} ${type === t ? styles.typePillActive : ''}`}
                                    style={type === t ? {
                                        background: `${eventTypeColors[t]}18`,
                                        borderColor: eventTypeColors[t],
                                        color: eventTypeColors[t],
                                    } : {}}
                                    onClick={() => setType(t)}
                                >
                                    {t.charAt(0) + t.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.formField}>
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Event details..." rows={3} />
                    </div>
                    <div className={styles.modalActions}>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                        <button className={styles.primaryBtn} onClick={handleSave} disabled={!title.trim() || !date || saving}>
                            {saving ? <Loader2 size={16} className={styles.spinner} /> : null}
                            {editingEvent ? 'Save Changes' : 'Add Event'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
