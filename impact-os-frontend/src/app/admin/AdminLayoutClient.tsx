'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, FileText, Users, DollarSign, Target,
    ChevronsLeft, Menu, X, Settings, LogOut, ChevronUp,
    UserCog, BookOpen, HeartHandshake, Send, MessageSquareQuote,
    Handshake, UserCircle, KeyRound,
    Shield, Layers, Calendar, Sliders
} from 'lucide-react';
import styles from './layout.module.css';
import { ToastProvider } from '@/components/admin/Toast';
import { NotificationHeader } from '@/components/ui/NotificationHeader';

// ─── Route → Page Title mapping ────────────────────────────────────
const routeTitles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/command-centre': 'Command Centre',
    '/admin/applicants': 'Applicants',
    '/admin/participants': 'Participants',
    '/admin/staff': 'Staff',
    '/admin/missions': 'Missions',
    '/admin/support': 'Support',
    '/admin/income': 'Income',
    '/admin/resources': 'Resources',
    '/admin/communications': 'Communications',
    '/admin/partners': 'Partners',
    '/admin/testimonials': 'Testimonials',
    '/admin/settings/profile': 'Profile',
    '/admin/email-templates': 'Communications',
    '/admin/settings/change-pin': 'Change PIN',
    '/admin/settings': 'Settings',
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
};

const getPageTitle = (pathname: string) => {
    // Exact match first
    if (routeTitles[pathname]) return routeTitles[pathname];
    // Check prefix matches for nested routes (e.g. /admin/participants/[id])
    const segments = pathname.split('/');
    while (segments.length > 2) {
        segments.pop();
        const prefix = segments.join('/');
        if (routeTitles[prefix]) return routeTitles[prefix];
    }
    return 'Admin';
};

// Grouped navigation structure — one-word labels
const navGroups = [
    {
        label: null,
        items: [
            { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
            { href: '/admin/command-centre', label: 'Command', Icon: Shield },
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
            { href: '/admin/resources', label: 'Resources', Icon: BookOpen },
        ]
    },
    {
        label: 'Engage',
        items: [
            { href: '/admin/communications', label: 'Comms', Icon: Send },
            { href: '/admin/partners', label: 'Partners', Icon: Handshake },
            { href: '/admin/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
        ]
    },
    {
        label: 'Settings',
        items: [
            { href: '/admin/settings', label: 'Settings', Icon: Settings },
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
        localStorage.removeItem('admin_user');
        localStorage.removeItem('user');
        router.push('/');
    };

    // Close mobile nav on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Auth check — redirect to login if no token
    // Skip auth for /admin/setup routes (staff invite setup pages)
    useEffect(() => {
        if (pathname.startsWith('/admin/setup')) return;
        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push('/login');
        }
    }, [router, pathname]);

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
                        onClick={() => collapsed ? setCollapsed(false) : undefined}
                        role={collapsed ? 'button' : undefined}
                        tabIndex={collapsed ? 0 : undefined}
                        style={collapsed ? { cursor: 'pointer' } : undefined}
                    >
                        <Image src="/triad.webp" alt="Impact OS" width={24} height={24} />
                        {!collapsed && <span>Project 3:10</span>}
                    </div>
                    {!collapsed && (
                        <button
                            className={styles.collapseToggle}
                            onClick={() => setCollapsed(true)}
                            aria-label="Collapse sidebar"
                        >
                            <ChevronsLeft size={16} />
                        </button>
                    )}
                </div>

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
                            <Link href="/admin/settings/profile" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                                <UserCircle size={16} />
                                <span>Profile</span>
                            </Link>
                            <Link href="/admin/settings/change-pin" className={styles.userMenuItem} onClick={() => setUserMenuOpen(false)}>
                                <KeyRound size={16} />
                                <span>Change PIN</span>
                            </Link>
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
                {/* Shared Top Bar */}
                <div className={styles.topBar}>
                    <div className={styles.topBarLeft}>
                        <h1>{getPageTitle(pathname)}</h1>
                    </div>
                    <div className={styles.topBarRight}>
                        <span className={styles.greeting}>{getGreeting()}</span>
                        <NotificationHeader variant="admin" />
                    </div>
                </div>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </main>
        </div>
    );
}
