'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Clock, User, FileText, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface PendingReview {
    id: string;
    userId: string;
    missionId: string;
    status: string;
    proofUrl?: string;
    proofText?: string;
    completedAt: string;
    mission: {
        title: string;
        description: string;
        skillDomain: string;
        difficulty: string;
        momentum: number;
        skillXp: number;
        arenaPoints: number;
    };
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export default function MissionReviewsPage() {
    const [reviews, setReviews] = useState<PendingReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const response = await fetch(`${API_URL}/api/missions/admin/pending`);
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (assignmentId: string) => {
        setProcessing(assignmentId);
        try {
            const response = await fetch(`${API_URL}/api/missions/admin/${assignmentId}/approve`, {
                method: 'POST',
            });
            if (response.ok) {
                setReviews(reviews.filter(r => r.id !== assignmentId));
            }
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (assignmentId: string) => {
        const reason = prompt('Reason for rejection (optional):');
        setProcessing(assignmentId);
        try {
            const response = await fetch(`${API_URL}/api/missions/admin/${assignmentId}/fail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason || 'Did not meet requirements' }),
            });
            if (response.ok) {
                setReviews(reviews.filter(r => r.id !== assignmentId));
            }
        } catch (error) {
            console.error('Failed to reject:', error);
        } finally {
            setProcessing(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <Loader2 className={styles.spinner} size={32} />
                <p>Loading pending reviews...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin/missions" className={styles.backLink}>
                    <ArrowLeft size={18} />
                    Back to Missions
                </Link>
                <div>
                    <h1>Pending Reviews</h1>
                    <p>{reviews.length} submission{reviews.length !== 1 ? 's' : ''} awaiting review</p>
                </div>
            </header>

            {reviews.length === 0 ? (
                <div className={styles.emptyState}>
                    <Check size={48} />
                    <h3>All Caught Up!</h3>
                    <p>No pending mission submissions to review.</p>
                </div>
            ) : (
                <div className={styles.reviewsList}>
                    {reviews.map((review) => (
                        <div key={review.id} className={styles.reviewCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.missionInfo}>
                                    <h3>{review.mission.title}</h3>
                                    <span className={`${styles.difficultyBadge} ${styles[review.mission.difficulty.toLowerCase()]}`}>
                                        {review.mission.difficulty}
                                    </span>
                                </div>
                                <div className={styles.timestamp}>
                                    <Clock size={14} />
                                    {formatDate(review.completedAt)}
                                </div>
                            </div>

                            <p className={styles.missionDesc}>{review.mission.description}</p>

                            <div className={styles.participantInfo}>
                                <User size={14} />
                                <span>{review.user.firstName} {review.user.lastName}</span>
                                <span className={styles.email}>{review.user.email}</span>
                            </div>

                            {(review.proofText || review.proofUrl) && (
                                <div className={styles.proofSection}>
                                    <h4><FileText size={14} /> Submission Proof</h4>
                                    {review.proofText && (
                                        <p className={styles.proofText}>{review.proofText}</p>
                                    )}
                                    {review.proofUrl && (
                                        <a
                                            href={review.proofUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.proofLink}
                                        >
                                            <ExternalLink size={14} />
                                            View Attached Proof
                                        </a>
                                    )}
                                </div>
                            )}

                            <div className={styles.actions}>
                                <button
                                    className={styles.rejectBtn}
                                    onClick={() => handleReject(review.id)}
                                    disabled={processing === review.id}
                                >
                                    <X size={16} />
                                    Reject
                                </button>
                                <button
                                    className={styles.approveBtn}
                                    onClick={() => handleApprove(review.id)}
                                    disabled={processing === review.id}
                                >
                                    {processing === review.id ? (
                                        <Loader2 className={styles.spinner} size={16} />
                                    ) : (
                                        <Check size={16} />
                                    )}
                                    Approve
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
