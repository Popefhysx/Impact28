'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Target, Gem, Wallet, CreditCard, User, Zap, Star, PanelLeftClose, PanelLeft, LogOut, Menu, X } from 'lucide-react';
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
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userName, setUserName] = useState('User');
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        // Get user info from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserName(`${user.firstName} ${user.lastName}`);
            setUserEmail(user.email);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('onboarding_complete');
        router.push('/login');
    };

    // Close mobile nav on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
        <UserProvider>
            <div className={styles.container}>
                {/* Mobile header */}
                <div className={styles.mobileHeader}>
                    <button
                        className={styles.mobileMenuBtn}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <span className={styles.mobileTitle}>Impact OS</span>
                </div>

                {/* Sidebar overlay for mobile */}
                {mobileOpen && (
                    <div
                        className={styles.overlay}
                        onClick={() => setMobileOpen(false)}
                    />
                )}

                <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
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
                            <div className={styles.avatar}>{userName.charAt(0)}</div>
                            {!collapsed && (
                                <div className={styles.userDetails}>
                                    <div className={styles.userName}>{userName}</div>
                                    <div className={styles.userEmail}>{userEmail}</div>
                                </div>
                            )}
                        </div>
                        <button
                            className={styles.logoutBtn}
                            onClick={handleLogout}
                            title="Log out"
                        >
                            <LogOut size={18} />
                            {!collapsed && <span>Log out</span>}
                        </button>
                    </div>
                </aside>

                <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : ''}`}>
                    {children}
                </main>
            </div>
        </UserProvider>
    );
}
