'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

type Step = 'email' | 'otp';

export default function LoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [firstName, setFirstName] = useState('');

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Check if email exists
            const checkRes = await fetch(`${API_BASE}/auth/check-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const checkData = await checkRes.json();

            if (!checkData.exists) {
                setError("We couldn't find an account with that email. Did you apply to Project 3:10?");
                setLoading(false);
                return;
            }

            setFirstName(checkData.firstName || '');

            // Request OTP
            const otpRes = await fetch(`${API_BASE}/auth/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const otpData = await otpRes.json();

            if (otpData.success) {
                setStep('otp');
            } else {
                setError(otpData.message || 'Failed to send code');
            }
        } catch (err) {
            setError('Unable to connect. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otp }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Store token
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redirect to dashboard
                router.push('/dashboard');
            } else {
                setError(data.message || 'Invalid code');
            }
        } catch (err) {
            setError('Unable to verify. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setError('');
        setLoading(true);

        try {
            await fetch(`${API_BASE}/auth/request-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            setError('New code sent!');
        } catch {
            setError('Failed to resend. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <h1>Project 3:10</h1>
                </div>

                {step === 'email' ? (
                    <>
                        <h2 className={styles.title}>Welcome back</h2>
                        <p className={styles.subtitle}>
                            Enter your email to receive a login code
                        </p>

                        <form onSubmit={handleEmailSubmit} className={styles.form}>
                            <input
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                required
                                autoFocus
                            />

                            {error && <p className={styles.error}>{error}</p>}

                            <button
                                type="submit"
                                className={styles.button}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Continue'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className={styles.title}>
                            {firstName ? `Hi ${firstName}!` : 'Check your email'}
                        </h2>
                        <p className={styles.subtitle}>
                            We sent a 6-digit code to <strong>{email}</strong>
                        </p>

                        <form onSubmit={handleOtpSubmit} className={styles.form}>
                            <input
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className={styles.otpInput}
                                maxLength={6}
                                required
                                autoFocus
                            />

                            {error && (
                                <p className={error === 'New code sent!' ? styles.success : styles.error}>
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className={styles.button}
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? 'Verifying...' : 'Log in'}
                            </button>
                        </form>

                        <div className={styles.links}>
                            <button
                                onClick={handleResendCode}
                                className={styles.link}
                                disabled={loading}
                            >
                                Resend code
                            </button>
                            <button
                                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                                className={styles.link}
                            >
                                Use different email
                            </button>
                        </div>
                    </>
                )}
            </div>

            <p className={styles.footer}>
                Don't have an account? <a href="https://cycle28.org/apply">Apply now</a>
            </p>
        </div>
    );
}
