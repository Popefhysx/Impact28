'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './accept.module.css';

interface AcceptResponse {
    success: boolean;
    message: string;
    userId?: string;
    dashboardUrl?: string;
}

export default function AcceptOfferPage() {
    const { token } = useParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) return;

        const acceptOffer = async () => {
            try {
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
                const response = await fetch(`${API_BASE}/intake/accept/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                const data: AcceptResponse = await response.json();

                if (response.ok && data.success) {
                    setStatus('success');
                    setMessage(data.message || 'Welcome to Project 3:10!');
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Something went wrong. Please try again or contact support.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('Unable to process your request. Please try again later.');
            }
        };

        acceptOffer();
    }, [token]);

    if (status === 'loading') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.spinner}></div>
                    <h1 className={styles.title}>Processing your acceptance...</h1>
                    <p className={styles.subtitle}>Just a moment while we set everything up for you.</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.iconError}>⚠️</div>
                    <h1 className={styles.title}>Oops, something went wrong</h1>
                    <p className={styles.subtitle}>{message}</p>
                    <a href="mailto:hello@cycle28.org" className={styles.link}>
                        Contact Support
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.iconSuccess}>🎉</div>
                <h1 className={styles.title}>Welcome to the Family!</h1>
                <p className={styles.message}>
                    We're so excited to have you join Project 3:10. Your journey to becoming
                    a skilled, earning professional starts now.
                </p>
                <div className={styles.highlights}>
                    <div className={styles.highlight}>
                        <span className={styles.emoji}>📚</span>
                        <span>Personalized learning path</span>
                    </div>
                    <div className={styles.highlight}>
                        <span className={styles.emoji}>💪</span>
                        <span>Weekly missions & challenges</span>
                    </div>
                    <div className={styles.highlight}>
                        <span className={styles.emoji}>💰</span>
                        <span>Real earning opportunities</span>
                    </div>
                </div>
                <p className={styles.cta}>
                    Your dashboard is ready. Let's get started!
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className={styles.button}
                >
                    Go to My Dashboard →
                </button>
            </div>
        </div>
    );
}
