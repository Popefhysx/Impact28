'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, DollarSign, Target, Zap, PanelLeftClose, PanelLeft } from 'lucide-react';
import styles from './layout.module.css';

const navItems = [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/applicants', label: 'Applicants', Icon: FileText },
    { href: '/admin/participants', label: 'Participants', Icon: Users },
    { href: '/admin/income', label: 'Income Review', Icon: DollarSign },
    { href: '/admin/missions', label: 'Missions', Icon: Target },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className={styles.container}>
            <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>
                        <Zap size={20} />
                        <span>Impact OS</span>
                    </Link>
                    <button
                        className={styles.collapseBtn}
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
                    </button>
                </div>

                <div className={styles.roleTag}>Admin</div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                        >
                            <item.Icon size={18} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.avatar}>A</div>
                        <div>
                            <div className={styles.userName}>Admin User</div>
                            <div className={styles.userRole}>Super Admin</div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : ''}`}>
                {children}
            </main>
        </div>
    );
}
