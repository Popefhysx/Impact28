'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Save, Loader2, Camera, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import styles from '../settings.module.css';

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    location: string;
    role: string;
    bio: string;
    avatarUrl?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        role: '',
        bio: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Fetch profile on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/api/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    location: data.location || '',
                    role: data.role || '',
                    bio: data.bio || '',
                    avatarUrl: data.avatarUrl,
                });
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSaved(false);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`${API_BASE}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: profile.phone,
                    location: profile.location,
                    role: profile.role,
                    bio: profile.bio,
                }),
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to save profile');
            }
        } catch (err) {
            setError('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof ProfileData, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <Loader2 size={24} className={styles.spinner} />
                    <span>Loading profile...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title="Profile"
                subtitle="Manage your personal information and preferences"
            />

            <div className={styles.content}>
                <div className={styles.card}>
                    {/* Avatar Section */}
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="Profile" />
                            ) : (
                                <span>{profile.firstName?.[0]}{profile.lastName?.[0]}</span>
                            )}
                        </div>
                        <button className={styles.avatarUpload}>
                            <Camera size={16} />
                            Change Photo
                        </button>
                    </div>

                    {/* Form Section */}
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>
                                <User size={14} />
                                First Name
                            </label>
                            <input
                                type="text"
                                value={profile.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                placeholder="Enter first name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>
                                <User size={14} />
                                Last Name
                            </label>
                            <input
                                type="text"
                                value={profile.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                placeholder="Enter last name"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>
                                <Mail size={14} />
                                Email
                            </label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className={styles.disabled}
                            />
                            <span className={styles.hint}>Email cannot be changed</span>
                        </div>

                        <div className={styles.formGroup}>
                            <label>
                                <Phone size={14} />
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="+234 XXX XXX XXXX"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>
                                <MapPin size={14} />
                                Location
                            </label>
                            <input
                                type="text"
                                value={profile.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="e.g. Lagos, Nigeria"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>
                                <Briefcase size={14} />
                                Role / Title
                            </label>
                            <input
                                type="text"
                                value={profile.role}
                                onChange={(e) => handleChange('role', e.target.value)}
                                placeholder="e.g. Program Director"
                            />
                        </div>

                        <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                            <label>Bio</label>
                            <textarea
                                value={profile.bio}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                placeholder="Tell us a bit about yourself..."
                                rows={4}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className={styles.error}>{error}</div>
                    )}

                    <div className={styles.actions}>
                        <button
                            className={`${styles.saveBtn} ${saved ? styles.saved : ''}`}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={16} className={styles.spinner} />
                                    Saving...
                                </>
                            ) : saved ? (
                                <>
                                    <Check size={16} />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
