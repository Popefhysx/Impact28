'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Target, TrendingUp, Trophy, Wallet, HeartHandshake, User, Star, PanelLeftClose, LogOut, Menu, X, Settings, ChevronUp, BookOpen, HelpCircle, ImageIcon } from 'lucide-react';
import { UserProvider } from '../context/UserContext';
import styles from './layout.module.css';

const navItems = [
    { href: '/dashboard', label: 'Home', Icon: Home },
    { href: '/dashboard/missions', label: 'Mission Control', Icon: Target },
    { href: '/dashboard/income', label: 'Income', Icon: Wallet },
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
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [userName, setUserName] = useState('User');
    const [userEmail, setUserEmail] = useState('');
    const [userId, setUserId] = useState('');
    const userMenuRef = useRef<HTMLDivElement>(null);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        // Get user info from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            setUserName(`${user.firstName} ${user.lastName}`);
            setUserEmail(user.email);
            setUserId(user.id || 'user-1');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('onboarding_complete');
        router.push('/');
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
                    <Link href="/" className={styles.mobileLogo}>
                        <Image src="/triad.webp" alt="Impact OS" width={32} height={32} />
                        <span className={styles.mobileTitle}>Impact OS</span>
                    </Link>
                    <button
                        className={styles.mobileMenuBtn}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
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
                        <div
                            className={styles.logo}
                            onClick={() => collapsed && setCollapsed(false)}
                            role={collapsed ? 'button' : undefined}
                            tabIndex={collapsed ? 0 : undefined}
                        >
                            <Image src="/triad.webp" alt="Impact OS" width={40} height={40} />
                            {!collapsed && <span>Impact OS</span>}
                        </div>
                        {!collapsed && (
                            <button
                                className={styles.collapseBtn}
                                onClick={() => setCollapsed(true)}
                                aria-label="Collapse sidebar"
                            >
                                <PanelLeftClose size={16} />
                            </button>
                        )}
                    </div>

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

                    {/* Secondary Links */}
                    <div className={styles.secondaryNav}>
                        <Link
                            href="/wall"
                            className={`${styles.secondaryItem} ${pathname === '/wall' ? styles.active : ''}`}
                        >
                            <ImageIcon size={18} />
                            <span>The Wall</span>
                        </Link>
                        <Link
                            href="/arena"
                            className={`${styles.secondaryItem} ${pathname === '/arena' ? styles.active : ''}`}
                        >
                            <Trophy size={18} />
                            <span>The Arena</span>
                        </Link>
                        <Link
                            href="/dashboard/resources"
                            className={`${styles.secondaryItem} ${pathname === '/dashboard/resources' ? styles.active : ''}`}
                        >
                            <BookOpen size={18} />
                            <span>Resources</span>
                        </Link>
                        <Link
                            href="/dashboard/support"
                            className={`${styles.secondaryItem} ${pathname === '/dashboard/support' ? styles.active : ''}`}
                        >
                            <HelpCircle size={18} />
                            <span>Get Help</span>
                        </Link>
                    </div>

                    <div className={styles.sidebarFooter} ref={userMenuRef}>
                        <div
                            className={styles.userInfo}
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            role="button"
                            tabIndex={0}
                        >
                            <div className={styles.avatar}>{userName.charAt(0)}</div>
                            {!collapsed && (
                                <>
                                    <div className={styles.userDetails}>
                                        <div className={styles.userName}>{userName}</div>
                                        <div className={styles.userEmail}>{userEmail}</div>
                                    </div>
                                    <ChevronUp size={16} className={`${styles.chevron} ${userMenuOpen ? styles.chevronOpen : ''}`} />
                                </>
                            )}
                        </div>
                        {userMenuOpen && (
                            <div className={styles.userMenu}>
                                <Link href="/dashboard/profile" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                                    <Settings size={16} />
                                    <span>Settings</span>
                                </Link>
                                <button className={styles.userMenuItem} onClick={handleLogout}>
                                    <LogOut size={16} />
                                    <span>Log out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                <main className={`${styles.main} ${collapsed ? styles.mainCollapsed : ''}`}>
                    {children}
                </main>
            </div>
        </UserProvider>
    );
}
