'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import styles from './PageHeader.module.css';

export interface PageHeaderTab {
    key: string;
    label: string;
    icon?: ReactNode;
    active?: boolean;
    href?: string;
    onClick?: () => void;
}

interface PageHeaderProps {
    title?: string;
    subtitle?: string;
    tabs?: PageHeaderTab[];
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, tabs, actions }: PageHeaderProps) {
    return (
        <div className={styles.pageHeader}>
            {title && (
                <header className={styles.header}>
                    <div>
                        <h1>{title}</h1>
                        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                    </div>
                </header>
            )}

            {(tabs || actions) && (
                <div className={styles.toolbar}>
                    {tabs && tabs.length > 0 && (
                        <div className={styles.sectionTabs}>
                            {tabs.map((tab) => {
                                const tabContent = (
                                    <>
                                        {tab.icon}
                                        {tab.label}
                                    </>
                                );

                                if (tab.href) {
                                    return (
                                        <Link
                                            key={tab.key}
                                            href={tab.href}
                                            className={`${styles.sectionTab} ${tab.active ? styles.active : ''}`}
                                        >
                                            {tabContent}
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={tab.key}
                                        className={`${styles.sectionTab} ${tab.active ? styles.active : ''}`}
                                        onClick={tab.onClick}
                                    >
                                        {tabContent}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {actions && (
                        <div className={styles.actions}>
                            {actions}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default PageHeader;
