/**
 * Button Component
 * 
 * A reusable button component using design system tokens.
 * Variants: primary, secondary, gold, danger, ghost
 * Sizes: sm, md, lg
 * 
 * Supports rendering as a Next.js Link when `href` is provided.
 */

import React from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    fullWidth?: boolean;
    children: React.ReactNode;
    className?: string;
}

interface ButtonAsButton extends BaseButtonProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> {
    href?: never;
}

interface ButtonAsLink extends BaseButtonProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> {
    href: string;
    disabled?: boolean;
}

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
    const {
        variant = 'primary',
        size = 'md',
        icon,
        iconPosition = 'left',
        loading = false,
        fullWidth = false,
        children,
        className,
        disabled,
        ...rest
    } = props;

    const classNames = [
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
    ].filter(Boolean).join(' ');

    const content = (
        <>
            {loading && <span className={styles.spinner} />}
            {!loading && icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
            <span>{children}</span>
            {!loading && icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
        </>
    );

    // Render as Link when href is provided
    if ('href' in props && props.href) {
        const { href, ...linkRest } = rest as Omit<ButtonAsLink, keyof BaseButtonProps>;
        return (
            <Link
                href={href}
                className={classNames}
                {...linkRest}
            >
                {content}
            </Link>
        );
    }

    // Render as button
    const buttonRest = rest as Omit<ButtonAsButton, keyof BaseButtonProps>;
    return (
        <button
            className={classNames}
            disabled={disabled || loading}
            {...buttonRest}
        >
            {content}
        </button>
    );
}
