'use client';

import { useRouter } from 'next/navigation';
import { Zap, Shield, Target, Star } from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  const router = useRouter();

  return (
    <main className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.logo}>
          <Zap size={40} className={styles.logoIcon} />
          <h1>Impact OS</h1>
        </div>
        <p className={styles.tagline}>Behavioral Operating System for Economic Transformation</p>
      </div>

      <div className={styles.portals}>
        <button
          className={styles.portalCard}
          onClick={() => router.push('/admin')}
        >
          <Shield size={32} className={styles.portalIcon} />
          <h2>Admin Console</h2>
          <p>Manage applicants, review income, oversee missions</p>
        </button>

        <button
          className={styles.portalCard}
          onClick={() => router.push('/dashboard')}
        >
          <Target size={32} className={styles.portalIcon} />
          <h2>Participant Dashboard</h2>
          <p>Missions, currency, stipend status, income tracking</p>
        </button>

        <button
          className={styles.portalCard}
          onClick={() => router.push('/mentor')}
        >
          <Star size={32} className={styles.portalIcon} />
          <h2>Mentor Portal</h2>
          <p>Guide participants, review progress, provide feedback</p>
        </button>
      </div>

      <div className={styles.footer}>
        <p>Select your portal to continue</p>
      </div>
    </main>
  );
}
