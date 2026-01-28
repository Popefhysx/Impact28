'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Target, Gem, Wallet, CreditCard, User, Zap, Star, PanelLeftClose, PanelLeft } from 'lucide-react';
import { UserProvider } from '../context/UserContext';
import styles from './layout.module.css';

const navItems = [
    { href: '/dashboard', label: 'Overview', Icon: Home },
    { href: '/dashboard/missions', label: 'Missions', Icon: Target },
    { href: '/dashboard/currency', label: 'Currency', Icon: Gem },
    { href: '/dashboard/income', label: 'My Income', Icon: Wallet },
    { href: '/dashboard/stipend', label: 'Stipend', Icon: CreditCard },
    { href: '/dashboard/profile', label: 'Profile', Icon: User },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <UserProvider>
            <div className={styles.container}>
                <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <Link href="/" className={styles.logo}>
                            <Zap size={20} />
                            {!collapsed && <span>Impact OS</span>}
                        </Link>
                        {!collapsed && (
                            <button
                                className={styles.collapseBtn}
                                onClick={() => setCollapsed(true)}
                                aria-label="Collapse sidebar"
                            >
                                <PanelLeftClose size={18} />
                            </button>
                        )}
                    </div>

                    {collapsed && (
                        <button
                            className={styles.expandBtn}
                            onClick={() => setCollapsed(false)}
                            aria-label="Expand sidebar"
                        >
                            <PanelLeft size={18} />
                        </button>
                    )}

                    <div className={styles.levelBadge}>
                        <Star size={20} className={styles.levelIcon} />
                        <div>
                            <div className={styles.levelName}>L3 Exposed</div>
                            <div className={styles.levelProgress}>320 XP to L4</div>
                        </div>
                    </div>

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
                                <div className={styles.userName}>Adaeze Okonkwo</div>
                                <div className={styles.userEmail}>adaeze@email.com</div>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : ''}`}>
                    {children}
                </main>
            </div>
        </UserProvider>
    );
}

