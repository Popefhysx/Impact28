'use client';

import { ReactNode } from 'react';
import styles from './StatCard.module.css';

export interface StatCardBadge {
    text: string;
    variant?: 'success' | 'warning' | 'danger' | 'gold';
}

export interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string | number;
    badges?: StatCardBadge[];
    onClick?: () => void;
}

export function StatCard({ icon, label, value, badges, onClick }: StatCardProps) {
    return (
        <div className={styles.statCard} onClick={onClick} role={onClick ? 'button' : undefined}>
            <div className={styles.statHeader}>
                <span className={styles.statIcon}>{icon}</span>
                <span className={styles.statLabel}>{label}</span>
            </div>
            <div className={styles.statValue}>{value}</div>
            {badges && badges.length > 0 && (
                <div className={styles.statBreakdown}>
                    {badges.map((badge, i) => (
                        <span key={i} className={`badge badge-${badge.variant || 'gold'}`}>
                            {badge.text}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StatCard;
