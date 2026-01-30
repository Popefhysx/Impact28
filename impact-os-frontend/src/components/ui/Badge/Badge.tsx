/**
 * Badge Component
 * 
 * A reusable badge/tag component using design system tokens.
 */

import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'gold' | 'info' | 'muted';

interface BadgeProps {
    variant?: BadgeVariant;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function Badge({
    variant = 'default',
    icon,
    children,
    className,
}: BadgeProps) {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${className || ''}`}>
            {icon && <span className={styles.icon}>{icon}</span>}
            {children}
        </span>
    );
}
