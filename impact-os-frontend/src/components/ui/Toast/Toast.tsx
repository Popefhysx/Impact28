'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import styles from './Toast.module.css';

/* ── Types ─────────────────────────────────────────── */
type ToastVariant = 'success' | 'warning' | 'error';

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
    exiting?: boolean;
}

interface ToastAPI {
    success: (message: string) => void;
    warning: (message: string) => void;
    error: (message: string) => void;
}

/* ── Context ───────────────────────────────────────── */
const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
    return ctx;
}

/* ── Icons (inline SVG) ────────────────────────────── */
const icons: Record<ToastVariant, React.ReactNode> = {
    success: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    ),
    warning: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4" /><path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
    ),
    error: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
        </svg>
    ),
};

/* ── Single Toast ──────────────────────────────────── */
function ToastItem({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
    return (
        <div className={`${styles.toast} ${styles[item.variant]} ${item.exiting ? styles.exiting : ''}`}>
            <span className={styles.icon}>{icons[item.variant]}</span>
            <span className={styles.message}>{item.message}</span>
            <button className={styles.close} onClick={() => onClose(item.id)} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
            </button>
        </div>
    );
}

/* ── Provider ──────────────────────────────────────── */
const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const idRef = useRef(0);

    const dismiss = useCallback((id: number) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 250);
    }, []);

    const push = useCallback((message: string, variant: ToastVariant) => {
        const id = ++idRef.current;
        setToasts(prev => [...prev, { id, message, variant }]);
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    }, [dismiss]);

    const api: ToastAPI = {
        success: (msg) => push(msg, 'success'),
        warning: (msg) => push(msg, 'warning'),
        error: (msg) => push(msg, 'error'),
    };

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div className={styles.container}>
                {toasts.map(t => (
                    <ToastItem key={t.id} item={t} onClose={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
