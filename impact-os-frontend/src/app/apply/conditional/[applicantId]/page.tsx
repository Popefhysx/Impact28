'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Clock, CheckCircle, AlertCircle, FileText, Upload, Send, ArrowLeft } from 'lucide-react';
import styles from './page.module.css';

interface Task {
    id: string;
    type: string;
    title: string;
    description: string;
    instructions: string[];
    completed: boolean;
    proofUrl: string | null;
    submittedAt: string | null;
    deadline: string;
    isOverdue: boolean;
}

interface ApplicantInfo {
    id: string;
    firstName: string;
    email: string;
}

export default function ConditionalTaskPage() {
    const params = useParams();
    const router = useRouter();
    const applicantId = params.applicantId as string;

    const [applicant, setApplicant] = useState<ApplicantInfo | null>(null);
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [proofText, setProofText] = useState('');
    const [proofUrl, setProofUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const response = await fetch(`${API_BASE}/conditional/tasks/${applicantId}`);
                if (!response.ok) {
                    throw new Error('Failed to load conditional task');
                }

                const data = await response.json();
                setApplicant(data.applicant);

                if (data.tasks && data.tasks.length > 0) {
                    // Fetch full task details
                    const taskRes = await fetch(`${API_BASE}/conditional/task/${data.tasks[0].id}`);
                    if (taskRes.ok) {
                        setTask(await taskRes.json());
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        if (applicantId) {
            fetchTask();
        }
    }, [applicantId, API_BASE]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task || (!proofText && !proofUrl)) return;

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/conditional/submit/${task.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicantId,
                    proofUrl: proofUrl || undefined,
                    proofText: proofText || undefined,
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const data = await response.json();
                setError(data.message || 'Submission failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDeadline = (deadline: string) => {
        const date = new Date(deadline);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Overdue';
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `${diffDays} days remaining`;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.loading}>Loading your task...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <AlertCircle size={48} className={styles.errorIcon} />
                    <h1>Something went wrong</h1>
                    <p className={styles.errorText}>{error}</p>
                    <button onClick={() => router.back()} className={styles.backButton}>
                        <ArrowLeft size={18} /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <CheckCircle size={64} className={styles.successIcon} />
                    <h1>Task Completed!</h1>
                    <p className={styles.successText}>
                        Congratulations, {applicant?.firstName}! You&apos;ve been admitted to Cycle 28.
                        Check your email for next steps.
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className={styles.primaryButton}
                    >
                        Continue to Login
                    </button>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <CheckCircle size={48} className={styles.successIcon} />
                    <h1>No Pending Tasks</h1>
                    <p>You have no outstanding conditional tasks.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.badge}>
                        <FileText size={16} />
                        Conditional Task Required
                    </div>
                    <div className={`${styles.deadlineBadge} ${task.isOverdue ? styles.overdue : ''}`}>
                        <Clock size={14} />
                        {formatDeadline(task.deadline)}
                    </div>
                </div>

                <h1>{task.title}</h1>
                <p className={styles.greeting}>
                    Hi {applicant?.firstName}, you&apos;re almost there!
                </p>
                <p className={styles.description}>{task.description}</p>

                <div className={styles.instructions}>
                    <h3>Instructions</h3>
                    <ul>
                        {task.instructions.map((instruction, i) => (
                            <li key={i}>{instruction}</li>
                        ))}
                    </ul>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {task.type === 'WHY_STATEMENT' ? (
                        <div className={styles.formGroup}>
                            <label>Your Why Statement</label>
                            <textarea
                                value={proofText}
                                onChange={(e) => setProofText(e.target.value)}
                                placeholder="Write your 200-word statement here..."
                                rows={8}
                                required
                                minLength={100}
                                maxLength={2000}
                            />
                            <span className={styles.charCount}>
                                {proofText.length} / 2000 characters
                            </span>
                        </div>
                    ) : (
                        <div className={styles.formGroup}>
                            <label>
                                <Upload size={16} /> Upload Proof (Google Drive, Dropbox, or direct link)
                            </label>
                            <input
                                type="url"
                                value={proofUrl}
                                onChange={(e) => setProofUrl(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                required
                            />
                            <p className={styles.hint}>
                                Share a link to your document, screenshot, or portfolio item.
                            </p>
                        </div>
                    )}

                    {task.type !== 'WHY_STATEMENT' && (
                        <div className={styles.formGroup}>
                            <label>Additional Notes (Optional)</label>
                            <textarea
                                value={proofText}
                                onChange={(e) => setProofText(e.target.value)}
                                placeholder="Any additional context you'd like to share..."
                                rows={4}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={submitting || task.isOverdue}
                    >
                        {submitting ? (
                            'Submitting...'
                        ) : (
                            <>
                                <Send size={18} />
                                Submit Task
                            </>
                        )}
                    </button>

                    {task.isOverdue && (
                        <p className={styles.overdueWarning}>
                            This task is overdue. Please contact support for assistance.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
