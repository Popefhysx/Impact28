/**
 * Select Component
 * 
 * A custom dropdown select that replaces native <select> to allow
 * full styling control over the dropdown options (fixing OS-rendered blue highlight).
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
    value: string;
    label: string;
    description?: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function Select({
    options,
    value,
    onChange,
    placeholder = 'Select an option...',
    disabled = false,
    className,
}: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div
            ref={containerRef}
            className={`${styles.container} ${className || ''}`}
        >
            <button
                type="button"
                className={`${styles.trigger} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
            >
                <span className={selectedOption ? styles.value : styles.placeholder}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={styles.chevron} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            <div className={styles.optionContent}>
                                <span className={styles.optionLabel}>{option.label}</span>
                                {option.description && (
                                    <span className={styles.optionDescription}>{option.description}</span>
                                )}
                            </div>
                            {option.value === value && (
                                <Check size={16} className={styles.checkIcon} />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
