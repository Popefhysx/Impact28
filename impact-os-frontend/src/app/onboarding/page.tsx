'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './onboarding.module.css';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    skillTrack?: string;
    applicant?: {
        triadTechnical?: number;
        triadSoft?: number;
        triadCommercial?: number;
    };
}

export default function OnboardingPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Check for auth token
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');

        if (!token) {
            router.push('/login');
            return;
        }

        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, [router]);

    const steps = [
        {
            title: `Welcome, ${user?.firstName}! 🎉`,
            content: "You've taken the first step toward becoming a skilled, earning professional. We're excited to have you in the Project 3:10 family.",
        },
        {
            title: 'Your Skill Profile',
            content: "Based on your assessment, we've mapped your starting strengths across three domains. Your personalized journey will help you grow in each area.",
            showTriad: true,
        },
        {
            title: 'Ready to Begin?',
            content: 'Your dashboard is set up with your first missions. Complete them to build momentum and unlock new opportunities.',
            showCta: true,
        },
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            // Mark onboarding complete and go to dashboard
            localStorage.setItem('onboarding_complete', 'true');
            router.push('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    const step = steps[currentStep];
    const triad = user?.applicant || { triadTechnical: 33, triadSoft: 33, triadCommercial: 33 };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                {/* Progress dots */}
                <div className={styles.progress}>
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.dot} ${i <= currentStep ? styles.active : ''}`}
                        />
                    ))}
                </div>

                <h1 className={styles.title}>{step.title}</h1>
                <p className={styles.content}>{step.content}</p>

                {/* Skill Triad visualization */}
                {step.showTriad && (
                    <div className={styles.triad}>
                        <div className={styles.triadItem}>
                            <div className={styles.triadLabel}>Technical</div>
                            <div className={styles.triadBar}>
                                <div
                                    className={styles.triadFill}
                                    style={{ width: `${triad.triadTechnical || 33}%` }}
                                />
                            </div>
                            <div className={styles.triadValue}>{triad.triadTechnical || 33}%</div>
                        </div>
                        <div className={styles.triadItem}>
                            <div className={styles.triadLabel}>Soft Skills</div>
                            <div className={styles.triadBar}>
                                <div
                                    className={`${styles.triadFill} ${styles.soft}`}
                                    style={{ width: `${triad.triadSoft || 33}%` }}
                                />
                            </div>
                            <div className={styles.triadValue}>{triad.triadSoft || 33}%</div>
                        </div>
                        <div className={styles.triadItem}>
                            <div className={styles.triadLabel}>Commercial</div>
                            <div className={styles.triadBar}>
                                <div
                                    className={`${styles.triadFill} ${styles.commercial}`}
                                    style={{ width: `${triad.triadCommercial || 33}%` }}
                                />
                            </div>
                            <div className={styles.triadValue}>{triad.triadCommercial || 33}%</div>
                        </div>
                    </div>
                )}

                {/* Final CTA */}
                {step.showCta && (
                    <div className={styles.highlights}>
                        <div className={styles.highlight}>
                            <span>📋</span>
                            <span>Weekly missions assigned</span>
                        </div>
                        <div className={styles.highlight}>
                            <span>📈</span>
                            <span>Track your progress in real-time</span>
                        </div>
                        <div className={styles.highlight}>
                            <span>💬</span>
                            <span>Community support available</span>
                        </div>
                    </div>
                )}

                <button onClick={handleNext} className={styles.button}>
                    {currentStep === steps.length - 1 ? 'Go to Dashboard →' : 'Continue'}
                </button>

                {currentStep > 0 && (
                    <button
                        onClick={() => setCurrentStep(currentStep - 1)}
                        className={styles.backButton}
                    >
                        ← Back
                    </button>
                )}
            </div>
        </div>
    );
}
