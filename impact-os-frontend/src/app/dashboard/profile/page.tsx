'use client';

import { User as UserIcon, Mail, Phone, MapPin, Award, Calendar, Edit2, Shield, Star } from 'lucide-react';
import styles from './page.module.css';

// Mock user data
const userData = {
    firstName: 'Adewale',
    lastName: 'Johnson',
    email: 'adewale.j@email.com',
    whatsapp: '+234 801 234 5678',
    location: 'Lagos, Nigeria',
    skillTrack: 'GRAPHIC_DESIGN',
    identityLevel: 'L2_SKILLED',
    cohort: 'Cohort 12',
    joinedAt: new Date('2025-11-15'),
    avatarUrl: null,
    bio: 'Aspiring graphic designer focused on brand identity and social media graphics. Building towards financial independence through design skills.',
};

const levelInfo: Record<string, { label: string; description: string; color: string }> = {
    'L0_APPLICANT': { label: 'Applicant', description: 'Application in progress', color: 'var(--text-muted)' },
    'L1_ACTIVATED': { label: 'Activated', description: 'Onboarding complete', color: 'var(--text-secondary)' },
    'L2_SKILLED': { label: 'Skilled', description: 'Technical skills demonstrated', color: 'var(--gold-warm)' },
    'L3_EXPOSED': { label: 'Exposed', description: 'Market exposure achieved', color: '#8b5cf6' },
    'L4_EARNER': { label: 'Earner', description: 'Income verified', color: '#10b981' },
    'L5_CATALYST': { label: 'Catalyst', description: 'Graduate & Mentor', color: '#ec4899' },
};

const skillTracks: Record<string, string> = {
    'GRAPHIC_DESIGN': 'Graphic Design',
    'WEB_DEVELOPMENT': 'Web Development',
    'DIGITAL_MARKETING': 'Digital Marketing',
    'VIDEO_EDITING': 'Video Editing',
    'VIRTUAL_ASSISTANT': 'Virtual Assistant',
    'DATA_ENTRY': 'Data Entry',
};

function getInitials(firstName: string, lastName: string) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function ProfilePage() {
    const level = levelInfo[userData.identityLevel] || levelInfo['L1_ACTIVATED'];
    const daysSinceJoined = Math.floor((Date.now() - userData.joinedAt.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>My Profile</h1>
                <button className="btn btn-secondary">
                    <Edit2 size={16} /> Edit Profile
                </button>
            </header>

            {/* Profile Card */}
            <div className={`card ${styles.profileCard}`}>
                <div className={styles.avatarSection}>
                    {userData.avatarUrl ? (
                        <img src={userData.avatarUrl} alt="Profile" className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {getInitials(userData.firstName, userData.lastName)}
                        </div>
                    )}
                    <div className={styles.nameSection}>
                        <h2>{userData.firstName} {userData.lastName}</h2>
                        <div className={styles.levelBadge} style={{ color: level.color }}>
                            <Shield size={14} />
                            <span>{level.label}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.bio}>
                    {userData.bio || 'No bio added yet.'}
                </div>

                <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                        <Mail size={16} />
                        <span>{userData.email}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <Phone size={16} />
                        <span>{userData.whatsapp}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <MapPin size={16} />
                        <span>{userData.location}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <Calendar size={16} />
                        <span>Joined {userData.joinedAt.toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className={styles.panels}>
                {/* Identity Level */}
                <div className={`card ${styles.levelCard}`}>
                    <h3>Identity Level</h3>
                    <div className={styles.levelProgress}>
                        {Object.entries(levelInfo).map(([key, info], index) => (
                            <div
                                key={key}
                                className={`${styles.levelStep} ${key === userData.identityLevel ? styles.current : ''} ${Object.keys(levelInfo).indexOf(userData.identityLevel) > index ? styles.completed : ''}`}
                            >
                                <div className={styles.levelDot} style={{ background: info.color }} />
                                <span className={styles.levelLabel}>{info.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.levelStatus}>
                        <strong style={{ color: level.color }}>{level.label}</strong>
                        <p>{level.description}</p>
                    </div>
                </div>

                {/* Skill Track */}
                <div className={`card ${styles.trackCard}`}>
                    <h3>Skill Track</h3>
                    <div className={styles.trackDisplay}>
                        <Star size={24} className={styles.trackIcon} />
                        <div>
                            <strong>{skillTracks[userData.skillTrack] || userData.skillTrack}</strong>
                            <p>Your current learning focus</p>
                        </div>
                    </div>
                    <div className={styles.trackStats}>
                        <div className={styles.trackStat}>
                            <span className={styles.statValue}>{daysSinceJoined}</span>
                            <span className={styles.statLabel}>Days in Program</span>
                        </div>
                        <div className={styles.trackStat}>
                            <span className={styles.statValue}>{userData.cohort}</span>
                            <span className={styles.statLabel}>Cohort</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Settings Preview */}
            <div className={`card ${styles.settingsCard}`}>
                <h3>Settings</h3>
                <div className={styles.settingsList}>
                    <div className={styles.settingItem}>
                        <span>Email Notifications</span>
                        <span className={styles.settingValue}>Enabled</span>
                    </div>
                    <div className={styles.settingItem}>
                        <span>WhatsApp Updates</span>
                        <span className={styles.settingValue}>Enabled</span>
                    </div>
                    <div className={styles.settingItem}>
                        <span>Weekly Check-in Reminders</span>
                        <span className={styles.settingValue}>Enabled</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
