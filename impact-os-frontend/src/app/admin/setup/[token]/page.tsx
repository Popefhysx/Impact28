'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface InviteInfo {
    email: string;
    category: string;
    capabilities: string[];
}

export default function StaffSetupPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();

    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdUsername, setCreatedUsername] = useState('');

    // Validate the token on load
    useEffect(() => {
        const validateToken = async () => {
            try {
                const res = await fetch(`${API_BASE}/staff/validate-invite/${token}`);
                if (res.ok) {
                    const data = await res.json();
                    setInviteInfo(data);
                    setIsValid(true);
                } else {
                    setIsValid(false);
                }
            } catch {
                setIsValid(false);
            } finally {
                setValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate name
        if (!firstName.trim() || !lastName.trim()) {
            setError('Please enter your full name');
            return;
        }

        // Validate username
        if (username.length < 3) {
            setError('Username must be at least 3 characters');
            return;
        }

        if (!/^[a-z][a-z0-9._]*$/.test(username)) {
            setError('Username must start with a letter and contain only lowercase letters, numbers, dots, and underscores');
            return;
        }

        // Validate PIN
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            setError('PIN must be exactly 4 digits');
            return;
        }

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/staff/accept-invite/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, username, pin }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to complete setup');
            }

            setCreatedUsername(data.username);
            setSuccess(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to complete setup. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePinChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
        setter(value);
    };

    // Loading state
    if (validating) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Validating your invite...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Invalid token
    if (!isValid) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.invalid}>
                        <div className={styles.invalidIcon}>⚠️</div>
                        <h2 className={styles.invalidTitle}>Invalid or Expired Invite</h2>
                        <p className={styles.invalidMessage}>
                            This invite link is no longer valid. Please contact an administrator for a new invite.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.success}>
                        <div className={styles.successIcon}>✅</div>
                        <h2 className={styles.successTitle}>Setup Complete!</h2>
                        <p className={styles.successMessage}>
                            Your account is ready. Use your username and PIN to log in.
                        </p>
                        <p style={{ marginBottom: '24px' }}>
                            <strong>Username:</strong> {createdUsername}
                        </p>
                        <Link href="/admin/login" className={styles.successBtn}>
                            Go to Admin Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Form
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <Image
                        src="/triad.webp"
                        alt="Impact OS"
                        width={72}
                        height={72}
                        className={styles.logo}
                    />
                    <span className={styles.badge}>{inviteInfo?.category}</span>
                    <h1 className={styles.title}>Complete Your Setup</h1>
                    <p className={styles.subtitle}>
                        You&apos;ve been invited to join the Impact OS admin team.
                        Set up your login credentials below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Your Name</h3>
                        <div className={styles.fieldRow}>
                            <div className={styles.field}>
                                <label htmlFor="firstName" className={styles.label}>
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    className={styles.input}
                                    autoFocus
                                />
                            </div>
                            <div className={styles.field}>
                                <label htmlFor="lastName" className={styles.label}>
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Doe"
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Choose Your Username</h3>
                        <div className={styles.field}>
                            <label htmlFor="username" className={styles.label}>
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                                placeholder="e.g., john.doe"
                                className={styles.input}
                                autoComplete="username"
                            />
                            <p className={styles.hint}>
                                Lowercase letters, numbers, dots, and underscores only
                            </p>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Create Your PIN</h3>
                        <div className={styles.pinRow}>
                            <div className={`${styles.field} ${styles.pinField}`}>
                                <label htmlFor="pin" className={styles.label}>
                                    4-Digit PIN
                                </label>
                                <input
                                    id="pin"
                                    type="password"
                                    inputMode="numeric"
                                    value={pin}
                                    onChange={handlePinChange(setPin)}
                                    placeholder="••••"
                                    className={`${styles.input} ${styles.pinInput}`}
                                    maxLength={4}
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className={`${styles.field} ${styles.pinField}`}>
                                <label htmlFor="confirmPin" className={styles.label}>
                                    Confirm PIN
                                </label>
                                <input
                                    id="confirmPin"
                                    type="password"
                                    inputMode="numeric"
                                    value={confirmPin}
                                    onChange={handlePinChange(setConfirmPin)}
                                    placeholder="••••"
                                    className={`${styles.input} ${styles.pinInput}`}
                                    maxLength={4}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>
                        <p className={styles.hint}>
                            Choose a PIN you&apos;ll remember — you&apos;ll use it to log in
                        </p>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Setting Up...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
}
