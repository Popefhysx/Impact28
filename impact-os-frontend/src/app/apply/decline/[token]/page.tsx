'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './decline.module.css';

interface DeclineResponse {
    success: boolean;
    message: string;
}

export default function DeclineOfferPage() {
    const { token } = useParams();
    const [status, setStatus] = useState<'confirm' | 'loading' | 'success' | 'error'>('confirm');
    const [message, setMessage] = useState('');

    const handleDecline = async () => {
        setStatus('loading');

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${API_BASE}/intake/decline/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data: DeclineResponse = await response.json();

            if (response.ok && data.success) {
                setStatus('success');
                setMessage(data.message || 'We understand. Thank you for considering us.');
            } else {
                setStatus('error');
                setMessage(data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Unable to process your request. Please try again later.');
        }
    };

    if (status === 'confirm') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.icon}>🤔</div>
                    <h1 className={styles.title}>Are you sure?</h1>
                    <p className={styles.message}>
                        We'd hate to see you go, but we understand that life happens.
                        If now isn't the right time, that's okay.
                    </p>
                    <p className={styles.note}>
                        If you're just not sure, you can take a few more days to decide.
                        Your offer is still valid.
                    </p>
                    <div className={styles.buttons}>
                        <button onClick={handleDecline} className={styles.buttonSecondary}>
                            Yes, decline my offer
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className={styles.buttonPrimary}
                        >
                            Wait, I want to reconsider
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (status === 'loading') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.spinner}></div>
                    <h1 className={styles.title}>Processing...</h1>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.icon}>⚠️</div>
                    <h1 className={styles.title}>Something went wrong</h1>
                    <p className={styles.message}>{message}</p>
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
                <div className={styles.icon}>💙</div>
                <h1 className={styles.title}>We'll Miss You</h1>
                <p className={styles.message}>
                    Thank you for taking the time to apply to Project 3:10.
                    We truly appreciate your interest in our program.
                </p>
                <div className={styles.encouragement}>
                    <p>
                        <strong>This isn't goodbye forever.</strong> Life circumstances change,
                        and we'd love to see you apply again when the timing is right.
                    </p>
                </div>
                <p className={styles.resources}>
                    In the meantime, check out our free resources:
                </p>
                <div className={styles.links}>
                    <a href="https://www.youtube.com/@Cycle28Official" className={styles.resourceLink}>
                        📺 YouTube Channel
                    </a>
                    <a href="https://cycle28.org/resources" className={styles.resourceLink}>
                        📚 Resource Library
                    </a>
                </div>
                <a href="https://cycle28.org" className={styles.homeLink}>
                    ← Back to Cycle 28
                </a>
            </div>
        </div>
    );
}
