'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Mail, Check, X, Loader2 } from 'lucide-react';
import styles from './NotificationHeader.module.css';

interface Notification {
    id: string;
    type: 'in_app' | 'email';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    link?: string;
}

interface NotificationHeaderProps {
    variant?: 'admin' | 'participant';
}

export function NotificationHeader({ variant = 'admin' }: NotificationHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch notifications on mount and when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    // Poll for unread count
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/api/notifications/unread-count`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setUnreadCount(data.count || 0);
            }
        } catch (error) {
            // Silently fail on count check
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`${API_BASE}/api/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`${API_BASE}/api/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
    };

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                className={`${styles.bellButton} ${variant === 'participant' ? styles.participant : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className={styles.badge}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h3>Notifications</h3>
                        {notifications.some(n => !n.read) && (
                            <button onClick={markAllAsRead} className={styles.markAllBtn}>
                                <Check size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className={styles.list}>
                        {loading ? (
                            <div className={styles.loading}>
                                <Loader2 size={20} className={styles.spinner} />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className={styles.empty}>
                                <Bell size={32} strokeWidth={1.5} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`${styles.item} ${!notification.read ? styles.unread : ''}`}
                                    onClick={() => {
                                        if (!notification.read) markAsRead(notification.id);
                                        if (notification.link) window.location.href = notification.link;
                                    }}
                                >
                                    <div className={styles.icon}>
                                        {notification.type === 'email' ? (
                                            <Mail size={16} />
                                        ) : (
                                            <Bell size={16} />
                                        )}
                                    </div>
                                    <div className={styles.content}>
                                        <span className={styles.title}>{notification.title}</span>
                                        <span className={styles.message}>{notification.message}</span>
                                        <span className={styles.time}>{formatTime(notification.createdAt)}</span>
                                    </div>
                                    {!notification.read && <div className={styles.unreadDot} />}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className={styles.footer}>
                            <a href={variant === 'admin' ? '/admin/notifications' : '/dashboard/notifications'}>
                                View all notifications
                            </a>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationHeader;
