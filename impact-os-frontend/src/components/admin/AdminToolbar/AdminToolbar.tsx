'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Search, LucideIcon } from 'lucide-react';
import styles from './AdminToolbar.module.css';

interface TabItem {
    label: string;
    href?: string;
    icon?: LucideIcon;
    active?: boolean;
    onClick?: () => void;
}

interface AdminToolbarProps {
    tabs?: TabItem[];
    searchValue?: string;
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;
    children?: ReactNode;
}

export function AdminToolbar({
    tabs,
    searchValue,
    searchPlaceholder = 'Search...',
    onSearchChange,
    children,
}: AdminToolbarProps) {
    return (
        <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
                {tabs && tabs.length > 0 && (
                    <div className={styles.sectionTabs}>
                        {tabs.map((tab, index) => {
                            const Icon = tab.icon;
                            const className = `${styles.sectionTab} ${tab.active ? styles.sectionTabActive : ''}`;

                            if (tab.href) {
                                return (
                                    <Link key={index} href={tab.href} className={className}>
                                        {Icon && <Icon size={16} />}
                                        {tab.label}
                                    </Link>
                                );
                            }

                            return (
                                <button
                                    key={index}
                                    className={className}
                                    onClick={tab.onClick}
                                >
                                    {Icon && <Icon size={16} />}
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {onSearchChange && (
                    <div className={styles.searchBox}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {children && (
                <div className={styles.toolbarRight}>
                    {children}
                </div>
            )}
        </div>
    );
}
