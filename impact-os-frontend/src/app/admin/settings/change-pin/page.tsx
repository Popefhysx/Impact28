'use client';

import { useState } from 'react';
import { KeyRound, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import styles from '../settings.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ChangePinPage() {
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaved(false);

        // Validate
        if (newPin.length < 4 || newPin.length > 6) {
            setError('PIN must be 4-6 digits');
            return;
        }

        if (!/^\d+$/.test(newPin)) {
            setError('PIN must contain only numbers');
            return;
        }

        if (newPin !== confirmPin) {
            setError('New PIN and confirmation do not match');
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/api/auth/change-pin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPin,
                    newPin,
                }),
            });

            if (res.ok) {
                setSaved(true);
                setCurrentPin('');
                setNewPin('');
                setConfirmPin('');
                setTimeout(() => setSaved(false), 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to change PIN');
            }
        } catch (err) {
            setError('Failed to change PIN. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.container}>

            <div className={styles.content}>
                <div className={styles.card}>
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGrid}>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label>
                                    <KeyRound size={14} />
                                    Current PIN
                                </label>
                                <input
                                    type="password"
                                    value={currentPin}
                                    onChange={(e) => setCurrentPin(e.target.value)}
                                    placeholder="Enter current PIN"
                                    maxLength={6}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    <KeyRound size={14} />
                                    New PIN
                                </label>
                                <input
                                    type="password"
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="4-6 digits"
                                    maxLength={6}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    required
                                />
                                <span className={styles.hint}>Must be 4-6 digits</span>
                            </div>

                            <div className={styles.formGroup}>
                                <label>
                                    <KeyRound size={14} />
                                    Confirm New PIN
                                </label>
                                <input
                                    type="password"
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Confirm new PIN"
                                    maxLength={6}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className={styles.error}>
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button
                                type="submit"
                                className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className={styles.spinner} />
                                        Updating...
                                    </>
                                ) : saved ? (
                                    <>
                                        <Check size={16} />
                                        PIN Updated!
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Change PIN
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
