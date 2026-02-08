'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './accept.module.css';

interface OfferData {
    valid: boolean;
    firstName: string;
    email: string;
    skillTrack: string | null;
    needsTrackSelection: boolean;
}

const SKILL_TRACKS = [
    { value: 'GRAPHICS_DESIGN', label: 'Graphics Design', icon: '🎨' },
    { value: 'DIGITAL_MARKETING', label: 'Digital Marketing', icon: '📱' },
    { value: 'WEB_DESIGN', label: 'Web Design', icon: '💻' },
    { value: 'VIDEO_PRODUCTION', label: 'Video Production', icon: '🎬' },
    { value: 'AI_FOR_BUSINESS', label: 'AI for Business', icon: '🤖' },
    { value: 'MUSIC_PRODUCTION', label: 'Music Production', icon: '🎵' },
];

export default function AcceptOfferPage() {
    const { token } = useParams();
    const router = useRouter();
    const [phase, setPhase] = useState<'validating' | 'form' | 'submitting' | 'success' | 'error'>('validating');
    const [offerData, setOfferData] = useState<OfferData | null>(null);
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [selectedTrack, setSelectedTrack] = useState('');
    const [message, setMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    useEffect(() => {
        if (!token) return;

        const validateOffer = async () => {
            try {
                const response = await fetch(`${API_BASE}/intake/validate-offer/${token}`);
                const data = await response.json();

                if (response.ok && data.valid) {
                    setOfferData(data);
                    setPhase('form');
                } else {
                    setPhase('error');
                    setMessage(data.message || 'This offer link is no longer valid.');
                }
            } catch {
                setPhase('error');
                setMessage('Unable to validate your offer. Please try again later.');
            }
        };

        validateOffer();
    }, [token, API_BASE]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};

        if (!/^[a-z][a-z0-9._]{2,}$/.test(username.toLowerCase().trim())) {
            errors.username = 'Must start with a letter, min 3 chars, lowercase letters/numbers/dots/underscores only';
        }
        if (!/^\d{4}$/.test(pin)) {
            errors.pin = 'Must be exactly 4 digits';
        }
        if (offerData?.needsTrackSelection && !selectedTrack) {
            errors.skillTrack = 'Please select your skill track';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setPhase('submitting');

        try {
            const body: Record<string, string> = {
                username: username.toLowerCase().trim(),
                pin,
            };
            if (offerData?.needsTrackSelection && selectedTrack) {
                body.skillTrack = selectedTrack;
            }

            const response = await fetch(`${API_BASE}/intake/accept/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setPhase('success');
                setMessage(data.message || 'Welcome to Project 3:10!');
            } else {
                setPhase('form');
                setMessage(data.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setPhase('form');
            setMessage('Unable to process your request. Please try again later.');
        }
    };

    if (phase === 'validating') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.spinner}></div>
                    <h1 className={styles.title}>Validating your offer...</h1>
                    <p className={styles.subtitle}>Just a moment while we check everything.</p>
                </div>
            </div>
        );
    }

    if (phase === 'error') {
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

    if (phase === 'success') {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.iconSuccess}>🎉</div>
                    <h1 className={styles.title}>Welcome to the Family!</h1>
                    <p className={styles.message}>
                        We&apos;re so excited to have you join Project 3:10. Your journey to becoming
                        a skilled, earning professional starts now.
                    </p>
                    <div className={styles.highlights}>
                        <div className={styles.highlight}>
                            <span className={styles.emoji}>📚</span>
                            <span>Personalized learning path</span>
                        </div>
                        <div className={styles.highlight}>
                            <span className={styles.emoji}>💪</span>
                            <span>Weekly missions &amp; challenges</span>
                        </div>
                        <div className={styles.highlight}>
                            <span className={styles.emoji}>💰</span>
                            <span>Real earning opportunities</span>
                        </div>
                    </div>
                    <p className={styles.cta}>
                        Your dashboard is ready. Let&apos;s get started!
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

    // Form phase
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>
                    Welcome, {offerData?.firstName}! 🎉
                </h1>
                <p className={styles.subtitle}>
                    Set up your account to accept your offer and begin your journey.
                </p>

                {message && <p className={styles.errorMessage}>{message}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Skill Track Selector — only for UNDECIDED */}
                    {offerData?.needsTrackSelection && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Choose Your Skill Track</label>
                            <p className={styles.fieldHint}>
                                Select the track that excites you most. This determines your learning path.
                            </p>
                            <div className={styles.trackGrid}>
                                {SKILL_TRACKS.map((track) => (
                                    <button
                                        key={track.value}
                                        type="button"
                                        className={`${styles.trackCard} ${selectedTrack === track.value ? styles.trackCardSelected : ''}`}
                                        onClick={() => setSelectedTrack(track.value)}
                                    >
                                        <span className={styles.trackIcon}>{track.icon}</span>
                                        <span className={styles.trackLabel}>{track.label}</span>
                                    </button>
                                ))}
                            </div>
                            {fieldErrors.skillTrack && (
                                <p className={styles.fieldError}>{fieldErrors.skillTrack}</p>
                            )}
                        </div>
                    )}

                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="username">Choose a Username</label>
                        <input
                            id="username"
                            type="text"
                            className={styles.input}
                            placeholder="e.g. john.doe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                        />
                        {fieldErrors.username && (
                            <p className={styles.fieldError}>{fieldErrors.username}</p>
                        )}
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="pin">Create a 4-Digit PIN</label>
                        <input
                            id="pin"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            className={styles.input}
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            autoComplete="new-password"
                        />
                        {fieldErrors.pin && (
                            <p className={styles.fieldError}>{fieldErrors.pin}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={phase === 'submitting'}
                    >
                        {phase === 'submitting' ? 'Setting up your account...' : 'Accept Offer & Join →'}
                    </button>
                </form>
            </div>
        </div>
    );
}
