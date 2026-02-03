'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Pencil, Trash2, Clock, Loader2 } from 'lucide-react';
import { PageHeader, Modal } from '@/components/ui';
import styles from '../settings.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

export default function CalendarPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [type, setType] = useState<EventType>('SESSION');
    const [description, setDescription] = useState('');

    const fetchEvents = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/calendar`);
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const openNewModal = () => {
        setEditingEvent(null);
        setTitle('');
        setDate('');
        setTime('');
        setType('SESSION');
        setDescription('');
        setShowModal(true);
    };

    const openEditModal = (event: CalendarEvent) => {
        setEditingEvent(event);
        setTitle(event.title);
        setDate(event.date.split('T')[0]);
        setTime(event.time || '');
        setType(event.type);
        setDescription(event.description || '');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!title.trim() || !date) return;
        setSaving(true);

        try {
            const payload = {
                title,
                date,
                time: time || undefined,
                type,
                description: description || undefined,
            };

            const url = editingEvent
                ? `${API_BASE}/settings/calendar/${editingEvent.id}`
                : `${API_BASE}/settings/calendar`;

            const res = await fetch(url, {
                method: editingEvent ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await fetchEvents();
                setShowModal(false);
            }
        } catch (error) {
            console.error('Failed to save event:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const res = await fetch(`${API_BASE}/settings/calendar/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchEvents();
            }
        } catch (error) {
            console.error('Failed to delete event:', error);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <PageHeader title="Calendar" subtitle="Manage program schedule" />
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={32} className={styles.spinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title="Calendar"
                subtitle="Manage program schedule and important events"
            />

            <div className={styles.toolbar}>
                <button className={styles.primaryBtn} onClick={openNewModal}>
                    <Plus size={16} />
                    Add Event
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Event</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event.id}>
                                <td className={styles.nameCell}>
                                    <Calendar size={16} />
                                    {event.title}
                                </td>
                                <td className={styles.dateCell}>
                                    <Calendar size={14} />
                                    {new Date(event.date).toLocaleDateString()}
                                </td>
                                <td className={styles.timeCell}>
                                    {event.time ? (
                                        <>
                                            <Clock size={14} />
                                            {event.time}
                                        </>
                                    ) : '—'}
                                </td>
                                <td>
                                    <span
                                        className={styles.typeBadge}
                                        style={{
                                            background: `${eventTypeColors[event.type]}20`,
                                            color: eventTypeColors[event.type],
                                        }}
                                    >
                                        {event.type}
                                    </span>
                                </td>
                                <td className={styles.descCell}>{event.description || '—'}</td>
                                <td>
                                    <div className={styles.actions}>
                                        <button
                                            className={styles.iconBtn}
                                            onClick={() => openEditModal(event)}
                                            title="Edit"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            className={`${styles.iconBtn} ${styles.danger}`}
                                            onClick={() => handleDelete(event.id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {events.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No events scheduled. Add events to create the program calendar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingEvent ? 'Edit Event' : 'New Event'}
            >
                <div className={styles.modalForm}>
                    <div className={styles.formField}>
                        <label>Event Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Orientation Session"
                        />
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formField}>
                            <label>Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                        <div className={styles.formField}>
                            <label>Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className={styles.formField}>
                        <label>Event Type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as EventType)}
                            className={styles.select}
                        >
                            <option value="ORIENTATION">Orientation</option>
                            <option value="DEADLINE">Deadline</option>
                            <option value="MILESTONE">Milestone</option>
                            <option value="SESSION">Session</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className={styles.formField}>
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Event details..."
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
                            disabled={!title.trim() || !date || saving}
                        >
                            {saving ? <Loader2 size={16} className={styles.spinner} /> : null}
                            {editingEvent ? 'Save Changes' : 'Add Event'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
