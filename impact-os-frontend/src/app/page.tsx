'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const trimmedUsername = username.trim().toLowerCase();

    // Simple username-based routing
    if (trimmedUsername === 'admin') {
      // Store admin session
      localStorage.setItem('auth_token', 'admin-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'admin-1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@impact-os.local',
        role: 'ADMIN'
      }));
      router.push('/admin');
    } else if (trimmedUsername === 'user') {
      // Store participant session
      localStorage.setItem('auth_token', 'user-token');
      localStorage.setItem('user', JSON.stringify({
        id: 'user-1',
        firstName: 'Demo',
        lastName: 'Participant',
        email: 'user@impact-os.local',
        role: 'PARTICIPANT'
      }));
      router.push('/dashboard');
    } else {
      setError('Use "admin" for Admin Console or "user" for Participant Dashboard');
      setLoading(false);
      return;
    }

    setLoading(false);
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
        <p className={styles.subtitle}>
          Enter your username to continue
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            required
            autoFocus
          />

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.button}
            disabled={loading || !username.trim()}
          >
            {loading ? 'Loading...' : 'Continue'}
          </button>
        </form>

        <div className={styles.hint}>
          <p><strong>admin</strong> → Admin Console</p>
          <p><strong>user</strong> → Participant Dashboard</p>
        </div>
      </div>

      <p className={styles.footer}>
        Project 3:10 × Cycle 28
      </p>
    </div>
  );
}
