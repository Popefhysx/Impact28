'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, User, MapPin, Briefcase, Monitor, Clock,
    Star, FileText, Check, X, AlertCircle, CheckCircle,
    Send, Loader2, HeartHandshake, Info
} from 'lucide-react';
import styles from './page.module.css';

// Types
interface ApplicantDetail {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    city?: string;
    currentStatus?: string;
    weeklyHours?: number;
    skillTrack?: string;
    technicalProbe?: string;
    commercialProbe?: string;
    exposureProbe?: string;
    commitmentProbe?: string;
    readinessScore?: number;
    actionOrientation?: number;
    marketAwareness?: number;
    rejectionResilience?: number;
    commitmentSignal?: number;
    riskFlags?: string[];
    aiRecommendation?: string;
    triadTechnical?: number;
    triadSoft?: number;
    triadCommercial?: number;
    offerType?: string;
    receivesStipend?: boolean;
    status: string;
    submittedAt?: string;
    // PSN Fields
    psnLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
    psnScore?: number;
    psnConfidence?: number;
    psnPrimaryConstraint?: 'DATA' | 'TRANSPORT' | 'TOOLS' | 'OTHER';
}

function SkillTriadMini({ technical, soft, commercial }: { technical: number; soft: number; commercial: number }) {
    const size = 120;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 45;

    const top = { x: centerX, y: centerY - radius };
    const bottomLeft = { x: centerX - radius * 0.866, y: centerY + radius * 0.5 };
    const bottomRight = { x: centerX + radius * 0.866, y: centerY + radius * 0.5 };

    const techPoint = {
        x: centerX + (top.x - centerX) * (technical / 100),
        y: centerY + (top.y - centerY) * (technical / 100),
    };
    const softPoint = {
        x: centerX + (bottomLeft.x - centerX) * (soft / 100),
        y: centerY + (bottomLeft.y - centerY) * (soft / 100),
    };
    const commPoint = {
        x: centerX + (bottomRight.x - centerX) * (commercial / 100),
        y: centerY + (bottomRight.y - centerY) * (commercial / 100),
    };

    return (
        <div className={styles.triadContainer}>
            <svg viewBox={`0 0 ${size} ${size}`} className={styles.triadSvg}>
                <polygon
                    points={`${top.x},${top.y} ${bottomLeft.x},${bottomLeft.y} ${bottomRight.x},${bottomRight.y}`}
                    fill="none"
                    stroke="var(--border-subtle)"
                    strokeWidth="1.5"
                />
                <polygon
                    points={`${techPoint.x},${techPoint.y} ${softPoint.x},${softPoint.y} ${commPoint.x},${commPoint.y}`}
                    fill="rgba(197, 173, 103, 0.3)"
                    stroke="var(--gold-warm)"
                    strokeWidth="2"
                />
                <circle cx={techPoint.x} cy={techPoint.y} r="4" fill="var(--gold-warm)" />
                <circle cx={softPoint.x} cy={softPoint.y} r="4" fill="var(--gold-warm)" />
                <circle cx={commPoint.x} cy={commPoint.y} r="4" fill="var(--gold-warm)" />
            </svg>
            <div className={styles.triadLabels}>
                <span>Technical: {technical}%</span>
                <span>Soft Skills: {soft}%</span>
                <span>Commercial: {commercial}%</span>
            </div>
        </div>
    );
}

export default function ApplicantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [deciding, setDeciding] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        // Mock data - will connect to backend
        const mockApplicant: ApplicantDetail = {
            id: params.id as string,
            email: 'adaeze@email.com',
            firstName: 'Adaeze',
            lastName: 'Okonkwo',
            phone: '+234 803 123 4567',
            country: 'Nigeria',
            city: 'Lagos',
            currentStatus: 'UNEMPLOYED',
            weeklyHours: 30,
            skillTrack: 'DESIGN',
            technicalProbe: 'I have been learning UI/UX design for 6 months through YouTube tutorials and Figma practice. I created a portfolio of 5 app redesign concepts and recently completed a Google UX certificate. I understand design thinking, wireframing, and prototyping fundamentals.',
            commercialProbe: 'I helped my cousin redesign their small business logo for free to build my portfolio. I have been applying to freelance jobs on Fiverr but haven\'t landed a paying client yet. I understand that I need to prove my skills with real work.',
            exposureProbe: 'I have faced many rejections in job applications which was discouraging. But I realized each rejection teaches me something. I started asking for feedback and improved my approach. Now I see rejection as data, not defeat.',
            commitmentProbe: 'I am ready to commit 30+ hours weekly because this is my priority. I have arranged my schedule to minimize distractions. My family supports my decision to focus on building this skill. I understand this is a 90-day intensive program.',
            readinessScore: 78,
            actionOrientation: 72,
            marketAwareness: 65,
            rejectionResilience: 81,
            commitmentSignal: 85,
            riskFlags: ['LOW_COMMERCIAL_EXPOSURE'],
            aiRecommendation: 'ADMIT',
            triadTechnical: 65,
            triadSoft: 55,
            triadCommercial: 35,
            offerType: 'FULL_SUPPORT',
            receivesStipend: true,
            status: 'SCORED',
            submittedAt: '2026-01-25T14:30:00Z',
            // PSN Data
            psnLevel: 'HIGH',
            psnScore: 78,
            psnConfidence: 0.85,
            psnPrimaryConstraint: 'DATA',
        };

        setTimeout(() => {
            setApplicant(mockApplicant);
            setLoading(false);
        }, 300);
    }, [params.id]);

    const handleDecision = async (decision: 'ADMITTED' | 'CONDITIONAL' | 'REJECTED') => {
        setDeciding(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In real implementation, call the API
        // await fetch(`/api/admin/applicants/${applicant?.id}/decision`, {
        //     method: 'POST',
        //     body: JSON.stringify({ decision, notes }),
        // });

        alert(`Decision: ${decision}\nNotes: ${notes || '(none)'}`);
        router.push('/admin/applicants');
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <Loader2 className={styles.spinner} size={24} />
                    Loading applicant details...
                </div>
            </div>
        );
    }

    if (!applicant) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>Applicant not found</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <Link href="/admin/applicants" className={styles.backLink}>
                    <ArrowLeft size={20} />
                    Back to Applicants
                </Link>
                <div className={styles.headerInfo}>
                    <div className={styles.avatar}>
                        {applicant.firstName[0]}{applicant.lastName[0]}
                    </div>
                    <div>
                        <h1>{applicant.firstName} {applicant.lastName}</h1>
                        <p className={styles.email}>{applicant.email}</p>
                    </div>
                </div>
                <div className={styles.headerMeta}>
                    <span className={`badge ${applicant.status === 'ADMITTED' ? 'badge-success' :
                        applicant.status === 'REJECTED' ? 'badge-danger' :
                            applicant.status === 'CONDITIONAL' ? 'badge-warning' :
                                'badge-gold'
                        }`}>
                        {applicant.status}
                    </span>
                    {applicant.skillTrack && (
                        <span className={styles.trackBadge}>{applicant.skillTrack.replace('_', ' ')}</span>
                    )}
                </div>
            </header>

            <div className={styles.content}>
                {/* Left Column - Details */}
                <div className={styles.detailsColumn}>
                    {/* Basic Info */}
                    <section className={styles.section}>
                        <h2><User size={18} /> Basic Information</h2>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <label>Phone</label>
                                <span>{applicant.phone || '—'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Location</label>
                                <span>{applicant.city}, {applicant.country}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Current Status</label>
                                <span>{applicant.currentStatus || '—'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Weekly Hours</label>
                                <span>{applicant.weeklyHours || '—'} hrs</span>
                            </div>
                        </div>
                    </section>

                    {/* Probe Responses */}
                    <section className={styles.section}>
                        <h2><FileText size={18} /> Probe Responses</h2>

                        <div className={styles.probe}>
                            <h3>Technical Probe</h3>
                            <p>{applicant.technicalProbe || '—'}</p>
                        </div>

                        <div className={styles.probe}>
                            <h3>Commercial Probe</h3>
                            <p>{applicant.commercialProbe || '—'}</p>
                        </div>

                        <div className={styles.probe}>
                            <h3>Exposure/Resilience Probe</h3>
                            <p>{applicant.exposureProbe || '—'}</p>
                        </div>

                        <div className={styles.probe}>
                            <h3>Commitment Probe</h3>
                            <p>{applicant.commitmentProbe || '—'}</p>
                        </div>
                    </section>
                </div>

                {/* Right Column - Scores & Decision */}
                <div className={styles.scoresColumn}>
                    {/* AI Scores */}
                    <section className={styles.section}>
                        <h2><Star size={18} /> AI Assessment</h2>

                        <div className={styles.scoreCard}>
                            <div className={styles.mainScore}>
                                <span className={styles.scoreLabel}>Readiness Score</span>
                                <span className={styles.scoreValue}>{applicant.readinessScore}%</span>
                            </div>

                            <div className={styles.scoreBreakdown}>
                                <div className={styles.scoreItem}>
                                    <span>Action Orientation</span>
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${applicant.actionOrientation}%` }} />
                                    </div>
                                    <span>{applicant.actionOrientation}%</span>
                                </div>
                                <div className={styles.scoreItem}>
                                    <span>Market Awareness</span>
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${applicant.marketAwareness}%` }} />
                                    </div>
                                    <span>{applicant.marketAwareness}%</span>
                                </div>
                                <div className={styles.scoreItem}>
                                    <span>Rejection Resilience</span>
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${applicant.rejectionResilience}%` }} />
                                    </div>
                                    <span>{applicant.rejectionResilience}%</span>
                                </div>
                                <div className={styles.scoreItem}>
                                    <span>Commitment Signal</span>
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${applicant.commitmentSignal}%` }} />
                                    </div>
                                    <span>{applicant.commitmentSignal}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Risk Flags */}
                        {applicant.riskFlags && applicant.riskFlags.length > 0 && (
                            <div className={styles.riskFlags}>
                                <h3>Risk Flags</h3>
                                {applicant.riskFlags.map((flag, i) => (
                                    <span key={i} className={styles.riskBadge}>
                                        <AlertCircle size={12} />
                                        {flag.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* AI Recommendation */}
                        <div className={styles.recommendation}>
                            <h3>AI Recommendation</h3>
                            <span className={`badge ${applicant.aiRecommendation === 'ADMIT' ? 'badge-success' :
                                applicant.aiRecommendation === 'CONDITIONAL' ? 'badge-warning' :
                                    'badge-danger'
                                }`}>
                                {applicant.aiRecommendation === 'ADMIT' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {applicant.aiRecommendation}
                            </span>
                        </div>
                    </section>

                    {/* Skill Triad */}
                    {applicant.triadTechnical !== undefined && (
                        <section className={styles.section}>
                            <h2>Skill Triad</h2>
                            <SkillTriadMini
                                technical={applicant.triadTechnical || 0}
                                soft={applicant.triadSoft || 0}
                                commercial={applicant.triadCommercial || 0}
                            />
                        </section>
                    )}

                    {/* Support & Offer Section - Consolidated */}
                    {(applicant.offerType || applicant.psnLevel) && (
                        <section className={styles.section}>
                            <h2><HeartHandshake size={18} /> Support & Offer</h2>
                            <div className={styles.supportOfferCard}>
                                {/* Offer Type */}
                                {applicant.offerType && (
                                    <div className={styles.supportOfferRow}>
                                        <span className={styles.supportOfferLabel}>Offer Type</span>
                                        <span className={`${styles.offerTypeBadge} ${styles[`offer${applicant.offerType}`]}`}>
                                            {applicant.offerType.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                )}

                                {/* Support Eligible */}
                                <div className={styles.supportOfferRow}>
                                    <span className={styles.supportOfferLabel}>Support Eligible</span>
                                    {applicant.receivesStipend ? (
                                        <span className={styles.stipendYes}>✓ Yes</span>
                                    ) : (
                                        <span className={styles.stipendNo}>✗ No</span>
                                    )}
                                </div>

                                {/* PSN Level */}
                                {applicant.psnLevel && (
                                    <div className={styles.supportOfferRow}>
                                        <span className={styles.supportOfferLabel}>PSN Level</span>
                                        <span className={`${styles.psnBadge} ${styles[`psn${applicant.psnLevel}`]}`}>
                                            {applicant.psnLevel}
                                        </span>
                                    </div>
                                )}

                                {/* Primary Constraint */}
                                {applicant.psnPrimaryConstraint && (
                                    <div className={styles.supportOfferRow}>
                                        <span className={styles.supportOfferLabel}>Primary Constraint</span>
                                        <span className={styles.constraintValue}>
                                            {applicant.psnPrimaryConstraint === 'DATA' && '📶 Data/Internet'}
                                            {applicant.psnPrimaryConstraint === 'TRANSPORT' && '🚌 Transport'}
                                            {applicant.psnPrimaryConstraint === 'TOOLS' && '💻 Tools/Devices'}
                                            {applicant.psnPrimaryConstraint === 'OTHER' && '📋 Other'}
                                        </span>
                                    </div>
                                )}

                                {/* PSN Confidence Bar */}
                                {applicant.psnScore !== undefined && (
                                    <div className={styles.psnScoreSection}>
                                        <div className={styles.psnScoreHeader}>
                                            <span>PSN Confidence</span>
                                            <span>{Math.round((applicant.psnConfidence || 0) * 100)}%</span>
                                        </div>
                                        <div className={styles.psnScoreBar}>
                                            <div style={{ width: `${applicant.psnScore}%` }} />
                                        </div>
                                    </div>
                                )}

                                <div className={styles.psnDisclaimer}>
                                    <Info size={12} />
                                    <span>PSN (Predicted Support Need) is a forecast estimate only. Support is request-based and behavior-gated.</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Decision Panel */}
                    {applicant.status !== 'ADMITTED' && applicant.status !== 'REJECTED' && (
                        <section className={styles.decisionPanel}>
                            <h2>Make Decision</h2>

                            <div className={styles.notesField}>
                                <label>Admin Notes (optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add notes about this decision..."
                                    rows={3}
                                />
                            </div>

                            <div className={styles.decisionButtons}>
                                <button
                                    className={styles.admitButton}
                                    onClick={() => handleDecision('ADMITTED')}
                                    disabled={deciding}
                                >
                                    {deciding ? <Loader2 className={styles.spinner} size={16} /> : <Check size={16} />}
                                    Admit
                                </button>
                                <button
                                    className={styles.conditionalButton}
                                    onClick={() => handleDecision('CONDITIONAL')}
                                    disabled={deciding}
                                >
                                    {deciding ? <Loader2 className={styles.spinner} size={16} /> : <Clock size={16} />}
                                    Conditional
                                </button>
                                <button
                                    className={styles.rejectButton}
                                    onClick={() => handleDecision('REJECTED')}
                                    disabled={deciding}
                                >
                                    {deciding ? <Loader2 className={styles.spinner} size={16} /> : <X size={16} />}
                                    Reject
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
