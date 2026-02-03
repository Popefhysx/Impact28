'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
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
        body: JSON.stringify({ username: trimmedUsername, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid username or PIN');
      }

      // Store auth token and user data
      localStorage.setItem('impact_os_token', data.token);
      localStorage.setItem('impact_os_user', JSON.stringify(data.user));

      // Also set legacy keys for compatibility
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Route based on user role
      if (data.user.role === 'ADMIN' || data.user.role === 'STAFF') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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

        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.subtitle}>
          Sign in with your username and PIN
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className={styles.input}
            autoComplete="username"
            autoFocus
          />

          <input
            type="password"
            inputMode="numeric"
            placeholder="4-digit PIN"
            value={pin}
            onChange={handlePinChange}
            className={styles.input}
            maxLength={4}
            autoComplete="current-password"
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !username.trim() || pin.length !== 4}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.hint}>
          <p>New staff? Check your email for a setup invite.</p>
        </div>
      </div>

      <p className={styles.footer}>
        Project 3:10 × Cycle 28
      </p>
    </div>
  );
}
