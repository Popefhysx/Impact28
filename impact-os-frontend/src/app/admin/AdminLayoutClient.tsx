'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Users, DollarSign, Target, PanelLeftClose, Menu, X, Settings, LogOut, ChevronUp, UserCog, BookOpen, HeartHandshake, Trophy, Mail, MessageSquareQuote, ImageIcon } from 'lucide-react';
import styles from './layout.module.css';

const navItems = [
    { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
    { href: '/admin/applicants', label: 'Applicants', Icon: FileText },
    { href: '/admin/participants', label: 'Participants', Icon: Users },
    { href: '/admin/support', label: 'Support', Icon: HeartHandshake },
    { href: '/admin/communications', label: 'Comms', Icon: Mail },
    { href: '/admin/income', label: 'Income', Icon: DollarSign },
    { href: '/admin/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
    { href: '/admin/missions', label: 'Missions', Icon: Target },
    { href: '/admin/staff', label: 'Staff', Icon: UserCog },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
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

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        router.push('/');
    };

    // Close mobile nav on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    return (
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
                        href="/admin/resources"
                        className={`${styles.secondaryItem} ${pathname === '/admin/resources' ? styles.active : ''}`}
                    >
                        <BookOpen size={18} />
                        <span>Resources</span>
                    </Link>
                </div>

                <div className={styles.sidebarFooter} ref={userMenuRef}>
                    <div
                        className={styles.userInfo}
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        role="button"
                        tabIndex={0}
                    >
                        <div className={styles.avatar}>A</div>
                        {!collapsed && (
                            <>
                                <div className={styles.userDetails}>
                                    <div className={styles.userName}>Admin User</div>
                                    <div className={styles.userRole}>Super Admin</div>
                                </div>
                                <ChevronUp size={16} className={`${styles.chevron} ${userMenuOpen ? styles.chevronOpen : ''}`} />
                            </>
                        )}
                    </div>
                    {userMenuOpen && (
                        <div className={styles.userMenu}>
                            <Link href="/admin" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
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
    );
}

