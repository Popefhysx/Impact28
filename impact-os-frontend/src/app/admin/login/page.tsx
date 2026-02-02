'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Please enter your username');
            return;
        }

        if (pin.length !== 4) {
            setError('Please enter your 4-digit PIN');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username.trim(), pin }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Invalid username or PIN');
            }

            // Store admin token
            localStorage.setItem('impact_os_admin_token', data.token);
            localStorage.setItem('impact_os_admin_user', JSON.stringify(data.user));

            // Redirect to admin dashboard
            router.push('/admin');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
        setPin(value);
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <Image
                        src="/triad.webp"
                        alt="Impact OS"
                        width={64}
                        height={64}
                        className={styles.logo}
                    />
                    <span className={styles.badge}>Admin Portal</span>
                    <h1 className={styles.title}>Staff Login</h1>
                    <p className={styles.subtitle}>Sign in to the Impact OS admin dashboard</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.field}>
                        <label htmlFor="username" className={styles.label}>
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            placeholder="your.username"
                            className={styles.input}
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="pin" className={styles.label}>
                            4-Digit PIN
                        </label>
                        <input
                            id="pin"
                            type="password"
                            inputMode="numeric"
                            value={pin}
                            onChange={handlePinChange}
                            placeholder="••••"
                            className={`${styles.input} ${styles.pinInput}`}
                            maxLength={4}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        Need help? <Link href="/help">Contact support</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
