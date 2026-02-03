'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'username' | 'pin' | 'otp'>('username');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setError('Please enter your username');
      return;
    }

    setStep('pin');
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid username or PIN');
      }

      // Store auth tokens
      localStorage.setItem('impact_os_token', data.token);
      localStorage.setItem('impact_os_user', JSON.stringify(data.user));
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Route based on role
      if (data.user.role === 'ADMIN' || data.user.role === 'STAFF') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = async () => {
    setError('');
    setLoading(true);

    try {
      // Request OTP using the username
      const res = await fetch(`${API_BASE}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Could not send OTP');
      }

      setEmail(data.email || ''); // Store masked email for display
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid code');
      }

      // Store auth tokens
      localStorage.setItem('impact_os_token', data.token);
      localStorage.setItem('impact_os_user', JSON.stringify(data.user));
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Route based on role
      if (data.user.role === 'ADMIN' || data.user.role === 'STAFF') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <Image
            src="/triad.webp"
            alt="Impact OS"
            width={100}
            height={100}
            className={styles.triadImage}
            priority
          />
          <h1>Impact OS</h1>
        </div>

        <h2 className={styles.title}>Welcome</h2>

        {step === 'username' && (
          <>
            <p className={styles.subtitle}>Enter your username to continue</p>
            <form onSubmit={handleUsernameSubmit} className={styles.form}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className={styles.input}
                autoComplete="username"
                autoFocus
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                type="submit"
                className={styles.button}
                disabled={!username.trim()}
              >
                Continue
              </button>
            </form>
          </>
        )}

        {step === 'pin' && (
          <>
            <p className={styles.subtitle}>Enter your PIN</p>
            <form onSubmit={handlePinSubmit} className={styles.form}>
              <input
                type="password"
                inputMode="numeric"
                placeholder="4-digit PIN"
                value={pin}
                onChange={handlePinChange}
                className={styles.input}
                maxLength={4}
                autoComplete="current-password"
                autoFocus
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                type="submit"
                className={styles.button}
                disabled={loading || pin.length !== 4}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className={styles.hint}>
              <button
                type="button"
                onClick={handleForgotPin}
                className={styles.linkButton}
                disabled={loading}
              >
                Forgot PIN? Use email instead
              </button>
              <button
                type="button"
                onClick={() => { setStep('username'); setPin(''); setError(''); }}
                className={styles.linkButton}
              >
                ← Back
              </button>
            </div>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className={styles.subtitle}>
              Enter the code sent to {email || 'your email'}
            </p>
            <form onSubmit={handleOtpSubmit} className={styles.form}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={otp}
                onChange={handleOtpChange}
                className={styles.input}
                maxLength={6}
                autoFocus
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                type="submit"
                className={styles.button}
                disabled={loading || otp.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            <div className={styles.hint}>
              <button
                type="button"
                onClick={() => { setStep('pin'); setOtp(''); setError(''); }}
                className={styles.linkButton}
              >
                ← Back to PIN
              </button>
            </div>
          </>
        )}

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <a
          href="https://cycle28.org/apply"
          className={styles.applyLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          Apply to join Project 3:10
        </a>
      </div>

      <p className={styles.footer}>
        Project 3:10 × Cycle 28
      </p>
    </div>
  );
}
