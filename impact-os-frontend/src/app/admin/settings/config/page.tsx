'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, Save, Loader2, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import styles from '../settings.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ProgramConfig {
    id: string;
    programName: string;
    organizationName: string;
    supportEmail: string;
    dashboardUrl?: string;
    otpExpiryMinutes: number;
    allowSelfSignup: boolean;
    requireOrientation: boolean;
    maxApplicationsPerCohort: number;
    supportRequestTTLDays: number;
    autoExpireSupportRequests: boolean;
}

export default function ConfigPage() {
    const [config, setConfig] = useState<ProgramConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Form state
    const [programName, setProgramName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [supportEmail, setSupportEmail] = useState('');
    const [dashboardUrl, setDashboardUrl] = useState('');
    const [otpExpiryMinutes, setOtpExpiryMinutes] = useState(10);
    const [allowSelfSignup, setAllowSelfSignup] = useState(false);
    const [requireOrientation, setRequireOrientation] = useState(true);
    const [maxApplicationsPerCohort, setMaxApplicationsPerCohort] = useState(50);
    const [supportRequestTTLDays, setSupportRequestTTLDays] = useState(30);
    const [autoExpireSupportRequests, setAutoExpireSupportRequests] = useState(true);

    const fetchConfig = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/config`);
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                // Populate form
                setProgramName(data.programName);
                setOrganizationName(data.organizationName);
                setSupportEmail(data.supportEmail);
                setDashboardUrl(data.dashboardUrl || '');
                setOtpExpiryMinutes(data.otpExpiryMinutes);
                setAllowSelfSignup(data.allowSelfSignup);
                setRequireOrientation(data.requireOrientation);
                setMaxApplicationsPerCohort(data.maxApplicationsPerCohort);
                setSupportRequestTTLDays(data.supportRequestTTLDays);
                setAutoExpireSupportRequests(data.autoExpireSupportRequests);
            }
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    // Track changes
    useEffect(() => {
        if (!config) return;
        const changed =
            programName !== config.programName ||
            organizationName !== config.organizationName ||
            supportEmail !== config.supportEmail ||
            dashboardUrl !== (config.dashboardUrl || '') ||
            otpExpiryMinutes !== config.otpExpiryMinutes ||
            allowSelfSignup !== config.allowSelfSignup ||
            requireOrientation !== config.requireOrientation ||
            maxApplicationsPerCohort !== config.maxApplicationsPerCohort ||
            supportRequestTTLDays !== config.supportRequestTTLDays ||
            autoExpireSupportRequests !== config.autoExpireSupportRequests;
        setHasChanges(changed);
        setSaved(false);
    }, [
        config, programName, organizationName, supportEmail, dashboardUrl,
        otpExpiryMinutes, allowSelfSignup, requireOrientation,
        maxApplicationsPerCohort, supportRequestTTLDays, autoExpireSupportRequests
    ]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/settings/config`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programName,
                    organizationName,
                    supportEmail,
                    dashboardUrl: dashboardUrl || undefined,
                    otpExpiryMinutes,
                    allowSelfSignup,
                    requireOrientation,
                    maxApplicationsPerCohort,
                    supportRequestTTLDays,
                    autoExpireSupportRequests,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                setHasChanges(false);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (error) {
            console.error('Failed to save config:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <PageHeader title="Program Config" subtitle="Loading settings..." />
                <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                    <Loader2 size={32} className={styles.spinner} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <PageHeader
                title="Program Config"
                subtitle="System-wide operational settings"
            />

            <div className={styles.configSections}>
                {/* Identity Section */}
                <section className={styles.configSection}>
                    <h3>🏷️ Program Identity</h3>
                    <div className={styles.configGrid}>
                        <div className={styles.formField}>
                            <label>Program Name</label>
                            <input
                                type="text"
                                value={programName}
                                onChange={(e) => setProgramName(e.target.value)}
                                placeholder="Cycle 28"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label>Organization Name</label>
                            <input
                                type="text"
                                value={organizationName}
                                onChange={(e) => setOrganizationName(e.target.value)}
                                placeholder="Project 3:10"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label>Support Email</label>
                            <input
                                type="email"
                                value={supportEmail}
                                onChange={(e) => setSupportEmail(e.target.value)}
                                placeholder="support@cycle28.org"
                            />
                        </div>
                        <div className={styles.formField}>
                            <label>Dashboard URL</label>
                            <input
                                type="url"
                                value={dashboardUrl}
                                onChange={(e) => setDashboardUrl(e.target.value)}
                                placeholder="https://dashboard.cycle28.org"
                            />
                        </div>
                    </div>
                </section>

                {/* Authentication Section */}
                <section className={styles.configSection}>
                    <h3>🔐 Authentication</h3>
                    <div className={styles.configGrid}>
                        <div className={styles.formField}>
                            <label>OTP Expiry (minutes)</label>
                            <input
                                type="number"
                                value={otpExpiryMinutes}
                                onChange={(e) => setOtpExpiryMinutes(parseInt(e.target.value) || 10)}
                                min={1}
                                max={60}
                            />
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={allowSelfSignup}
                                    onChange={(e) => setAllowSelfSignup(e.target.checked)}
                                />
                                Allow Self Signup
                            </label>
                            <span className={styles.hint}>Allow users to register without application</span>
                        </div>
                    </div>
                </section>

                {/* Program Rules Section */}
                <section className={styles.configSection}>
                    <h3>📋 Program Rules</h3>
                    <div className={styles.configGrid}>
                        <div className={styles.formField}>
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={requireOrientation}
                                    onChange={(e) => setRequireOrientation(e.target.checked)}
                                />
                                Require Orientation
                            </label>
                            <span className={styles.hint}>Participants must complete orientation before missions</span>
                        </div>
                        <div className={styles.formField}>
                            <label>Max Applications Per Cohort</label>
                            <input
                                type="number"
                                value={maxApplicationsPerCohort}
                                onChange={(e) => setMaxApplicationsPerCohort(parseInt(e.target.value) || 50)}
                                min={1}
                            />
                        </div>
                    </div>
                </section>

                {/* Support System Section */}
                <section className={styles.configSection}>
                    <h3>🤝 Support System</h3>
                    <div className={styles.configGrid}>
                        <div className={styles.formField}>
                            <label>Request TTL (days)</label>
                            <input
                                type="number"
                                value={supportRequestTTLDays}
                                onChange={(e) => setSupportRequestTTLDays(parseInt(e.target.value) || 30)}
                                min={1}
                            />
                            <span className={styles.hint}>Days before approved requests auto-expire</span>
                        </div>
                        <div className={styles.formField}>
                            <label className={styles.toggleLabel}>
                                <input
                                    type="checkbox"
                                    checked={autoExpireSupportRequests}
                                    onChange={(e) => setAutoExpireSupportRequests(e.target.checked)}
                                />
                                Auto-Expire Support Requests
                            </label>
                            <span className={styles.hint}>Automatically mark approved requests as expired after TTL</span>
                        </div>
                    </div>
                </section>
            </div>

            <div className={styles.configActions}>
                <button
                    className={`${styles.primaryBtn} ${saved ? styles.success : ''}`}
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                >
                    {saving ? (
                        <Loader2 size={16} className={styles.spinner} />
                    ) : saved ? (
                        <Check size={16} />
                    ) : (
                        <Save size={16} />
                    )}
                    {saved ? 'Saved!' : 'Save Configuration'}
                </button>
            </div>
        </div>
    );
}
