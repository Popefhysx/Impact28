/**
 * Button Component
 * 
 * A reusable button component using design system tokens.
 * Variants: primary, secondary, gold, danger, ghost
 * Sizes: sm, md, lg
 */

import React from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    loading = false,
    fullWidth = false,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const classNames = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classNames}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <span className={styles.spinner} />}
            {!loading && icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
            <span>{children}</span>
            {!loading && icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
        </button>
    );
}
