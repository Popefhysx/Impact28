/**
 * FormGroup Component
 * 
 * A reusable form field wrapper with label and optional helper text.
 */

import React from 'react';
import styles from './FormGroup.module.css';

interface FormGroupProps {
    label: string;
    htmlFor?: string;
    helper?: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}

export function FormGroup({
    label,
    htmlFor,
    helper,
    error,
    required,
    children,
}: FormGroupProps) {
    return (
        <div className={`${styles.formGroup} ${error ? styles.hasError : ''}`}>
            <label htmlFor={htmlFor} className={styles.label}>
                {label}
                {required && <span className={styles.required}>*</span>}
            </label>
            {children}
            {helper && !error && <p className={styles.helper}>{helper}</p>}
            {error && <p className={styles.error}>{error}</p>}
        </div>
    );
}
