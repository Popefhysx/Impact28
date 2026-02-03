'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, FileText, Users, DollarSign, Target,
    PanelLeftClose, Menu, X, Settings, LogOut, ChevronUp,
    UserCog, BookOpen, HeartHandshake, Send, MessageSquareQuote,
    ImageIcon, Handshake, Trophy, Calendar, Layers, Sliders
} from 'lucide-react';
import { NotificationHeader } from '@/components/ui';
import styles from './layout.module.css';

// Grouped navigation structure
const navGroups = [
    {
        label: null, // No label for dashboard
        items: [
            { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
        ]
    },
    {
        label: 'People',
        items: [
            { href: '/admin/applicants', label: 'Applicants', Icon: FileText },
            { href: '/admin/participants', label: 'Participants', Icon: Users },
            { href: '/admin/staff', label: 'Staff', Icon: UserCog },
        ]
    },
    {
        label: 'Program',
        items: [
            { href: '/admin/missions', label: 'Missions', Icon: Target },
            { href: '/admin/support', label: 'Support', Icon: HeartHandshake },
            { href: '/admin/income', label: 'Income', Icon: DollarSign },
        ]
    },
    {
        label: 'Engagement',
        items: [
            { href: '/admin/communications', label: 'Communications', Icon: Send },
            { href: '/admin/partners', label: 'Partners', Icon: Handshake },
            { href: '/admin/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
        ]
    },
    {
        label: 'Content',
        items: [
            { href: '/wall', label: 'The Wall', Icon: ImageIcon },
            { href: '/arena', label: 'The Arena', Icon: Trophy },
            { href: '/admin/resources', label: 'Resources', Icon: BookOpen },
        ]
    },
    {
        label: 'Settings',
        items: [
            { href: '/admin/settings/cohorts', label: 'Cohorts', Icon: Users },
            { href: '/admin/settings/phases', label: 'Phases', Icon: Layers },
            { href: '/admin/settings/calendar', label: 'Calendar', Icon: Calendar },
            { href: '/admin/settings/config', label: 'Program Config', Icon: Sliders },
        ]
    },
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

    // Check if any item in a group is active
    const isGroupActive = (items: { href: string }[]) => {
        return items.some(item =>
            pathname === item.href || pathname.startsWith(item.href + '/')
        );
    };

    // Check if single item is active
    const isItemActive = (href: string) => {
        if (href === '/admin') {
            return pathname === '/admin';
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

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
                    {navGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className={styles.navGroup}>
                            {group.label && !collapsed && (
                                <div className={styles.navGroupLabel}>{group.label}</div>
                            )}
                            {group.label && collapsed && (
                                <div className={styles.navGroupDivider} />
                            )}
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${styles.navItem} ${isItemActive(item.href) ? styles.active : ''}`}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <item.Icon size={18} />
                                    {!collapsed && <span>{item.label}</span>}
                                </Link>
                            ))}
                        </div>
                    ))}
                </nav>

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
                            <Link href="/admin/settings/config" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
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
                <div className={styles.topBar}>
                    <div className={styles.topBarRight}>
                        <NotificationHeader variant="admin" />
                    </div>
                </div>
                {children}
            </main>
        </div>
    );
}
