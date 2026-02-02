'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApplicantInfo {
    firstName: string;
    email: string;
}

export default function AcceptOfferPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const router = useRouter();

    const [applicant, setApplicant] = useState<ApplicantInfo | null>(null);
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
                // Check if token is valid (simple check via endpoint)
                const res = await fetch(`${API_BASE}/intake/validate-offer/${token}`);
                if (res.ok) {
                    const data = await res.json();
                    setApplicant(data);
                    // Suggest a username based on their name
                    const suggestedUsername = `${data.firstName.toLowerCase()}`.replace(/[^a-z]/g, '');
                    setUsername(suggestedUsername);
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
            const res = await fetch(`${API_BASE}/intake/accept/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, pin }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to accept offer');
            }

            // Store token for auto-login
            localStorage.setItem('impact_os_token', data.token || '');
            localStorage.setItem('impact_os_user', JSON.stringify(data.user || {}));

            setCreatedUsername(data.username);
            setSuccess(true);

            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to accept offer. Please try again.');
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
                        <p>Validating your offer...</p>
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
                        <h2 className={styles.invalidTitle}>Invalid or Expired Link</h2>
                        <p className={styles.invalidMessage}>
                            This offer link is no longer valid. Please contact support if you believe this is an error.
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
                        <div className={styles.successIcon}>🎉</div>
                        <h2 className={styles.successTitle}>Welcome to Project 3:10!</h2>
                        <p className={styles.successMessage}>
                            Your account has been created. Remember your credentials:
                        </p>
                        <div className={styles.credentialBox}>
                            <p className={styles.credentialLabel}>Username</p>
                            <p className={styles.credentialValue}>{createdUsername}</p>
                        </div>
                        <p className={styles.successMessage}>
                            Redirecting to your dashboard...
                        </p>
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
                        alt="Project 3:10"
                        width={72}
                        height={72}
                        className={styles.logo}
                    />
                    <h1 className={styles.title}>Welcome, <span className={styles.greeting}>{applicant?.firstName}</span>!</h1>
                    <p className={styles.subtitle}>
                        Set up your login credentials to complete your enrollment in Project 3:10.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.error}>{error}</div>}

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
                                autoFocus
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
                            Choose a PIN you'll remember — you'll use it to log in
                        </p>
                    </div>

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Accept Offer & Start'}
                    </button>
                </form>
            </div>
        </div>
    );
}
