'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, User, MapPin, Briefcase, Monitor, Clock,
    Star, FileText, Check, X, AlertCircle, CheckCircle,
    Send, Loader2, HeartHandshake, Info
} from 'lucide-react';
import { useToast } from '@/components/admin/Toast';
import styles from './page.module.css';

// Types
interface DiagnosticReport {
    method?: 'RULE_BASED' | 'AI_CLAUDE_SONNET';
    explanation?: string;
    aiReasoning?: string;
}

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
    diagnosticReport?: DiagnosticReport;
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

// Helper: Convert 0-1 decimal score to percentage string
function formatScore(score: number | undefined): string {
    if (score === undefined || score === null) return '—';
    // Scores are stored as 0-1 decimals, convert to percentage
    const percent = Math.round(score * 100);
    return `${percent}%`;
}

// Helper: Format weeklyHours enum to readable text
function formatWeeklyHours(hours: string | number | undefined): string {
    if (!hours) return '—';
    const hoursMap: Record<string, string> = {
        'UNDER_5': 'Under 5 hours',
        'FIVE_TO_TEN': '5-10 hours',
        'TEN_TO_TWENTY': '10-20 hours',
        'OVER_TWENTY': '20+ hours',
    };
    return hoursMap[String(hours)] || String(hours);
}

// Helper: Format CurrentStatus enum to readable text
function formatCurrentStatus(status: string | undefined): string {
    if (!status) return '—';
    const statusMap: Record<string, string> = {
        'UNEMPLOYED': 'Unemployed',
        'UNDEREMPLOYED': 'Underemployed',
        'STUDENT': 'Student',
        'CAREGIVER': 'Caregiver',
        'BETWEEN_JOBS': 'Between Jobs',
        'STRUGGLING_BUSINESS': 'Struggling Business',
    };
    return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Helper: Parse the recommendation reasoning into structured parts for display
interface RecommendationParts {
    summary: string;
    strengths?: string;
    concerns?: string;
    method: string;
}

function getRecommendationParts(applicant: ApplicantDetail): RecommendationParts {
    const report = applicant.diagnosticReport;
    const method = report?.method === 'AI_CLAUDE_SONNET' ? '🤖 AI Analysis' : '📊 Rule-Based';

    // AI reasoning may be a pre-formatted string with "Strengths:" and "Concerns:" sections
    const reasoning = report?.aiReasoning || report?.explanation;

    if (reasoning) {
        // Try to parse structured sections from the reasoning string
        const strengthsMatch = reasoning.match(/Strengths?:\s*([\s\S]+?)(?=Concerns?:|$)/i);
        const concernsMatch = reasoning.match(/Concerns?:\s*([\s\S]+?)$/i);

        if (strengthsMatch || concernsMatch) {
            // Strip the Strengths/Concerns sections from the summary
            const summary = reasoning
                .replace(/Strengths?:\s*[\s\S]+?(?=Concerns?:|$)/i, '')
                .replace(/Concerns?:\s*[\s\S]+$/i, '')
                .trim();
            return {
                summary: summary || reasoning.split('.')[0] + '.',
                strengths: strengthsMatch?.[1]?.trim(),
                concerns: concernsMatch?.[1]?.trim(),
                method,
            };
        }

        return { summary: reasoning, method };
    }

    // Fallback: build context from score data
    const parts: string[] = [];
    const score = applicant.readinessScore;
    const rec = applicant.aiRecommendation;

    if (score !== undefined && score !== null) {
        const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);
        if (rec === 'ADMIT') {
            parts.push(`Strong readiness score of ${pct}%, showing solid preparation for the program.`);
        } else if (rec === 'WAITLIST') {
            parts.push(`Readiness score of ${pct}% is below the admission threshold but shows potential.`);
        } else if (rec === 'REJECT') {
            parts.push(`Readiness score of ${pct}% indicates significant gaps that need addressing before joining.`);
        } else {
            parts.push(`Readiness score: ${pct}%.`);
        }
    }

    if (applicant.riskFlags && applicant.riskFlags.length > 0) {
        const flagLabels: Record<string, string> = {
            LOW_ACTION_ORIENTATION: 'passive approach to applying skills',
            LOW_MARKET_AWARENESS: 'limited commercial understanding',
            LOW_REJECTION_RESILIENCE: 'may struggle with setbacks',
            WEAK_COMMITMENT_SIGNAL: 'unclear program commitment',
            NO_INTERNET_ACCESS: 'no reliable internet access',
            LIMITED_TIME_COMMITMENT: 'limited available hours',
            SHARED_DEVICE: 'uses a shared device',
        };
        const flags = applicant.riskFlags
            .slice(0, 3)
            .map(f => flagLabels[f] || f.replace(/_/g, ' ').toLowerCase());
        return {
            summary: parts.join(' '),
            concerns: flags.join('; '),
            method,
        };
    }

    return {
        summary: parts.length > 0 ? parts.join(' ') : 'Recommendation based on readiness threshold assessment.',
        method,
    };
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
    const { showToast } = useToast();
    const [applicant, setApplicant] = useState<ApplicantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [decidingAction, setDecidingAction] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        const fetchApplicant = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/admin/applicants/${params.id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch applicant');
                }

                const data = await response.json();
                setApplicant({
                    ...data,
                    phone: data.whatsapp,
                    city: data.state,
                });
            } catch (error) {
                console.error('Error fetching applicant:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchApplicant();
        }
    }, [params.id]);

    const handleDecision = async (decision: 'ADMITTED' | 'WAITLIST' | 'REJECTED') => {
        if (!applicant) return;

        setDecidingAction(decision);
        try {
            const token = localStorage.getItem('auth_token');
            const body: Record<string, string> = { decision, notes };
            if (decision === 'REJECTED' && rejectionReason) {
                body.rejectionReason = rejectionReason;
            }
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/admin/applicants/${applicant.id}/decision`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }
            );

            if (!response.ok) {
                const err = await response.json().catch(() => null);
                throw new Error(err?.message || 'Failed to make decision');
            }

            const result = await response.json();
            showToast('success', result.message || `Applicant ${decision.toLowerCase()} successfully`);
            setTimeout(() => router.push('/admin/applicants'), 1500);
        } catch (error) {
            console.error('Error making decision:', error);
            showToast('error', error instanceof Error ? error.message : 'Failed to save decision. Please try again.');
        } finally {
            setDecidingAction(null);
        }
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
                            applicant.status === 'WAITLIST' ? 'badge-warning' :
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
                                <span>{formatCurrentStatus(applicant.currentStatus)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Weekly Hours</label>
                                <span>{formatWeeklyHours(applicant.weeklyHours)}</span>
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
                                <span className={styles.scoreValue}>{formatScore(applicant.readinessScore)}</span>
                            </div>

                            <div className={styles.scoreBreakdown}>
                                <div className={styles.scoreItem}>
                                    <span>Action Orientation</span>
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${(applicant.actionOrientation || 0) * 100}%` }} />
                                    </div>
                                    <span>{formatScore(applicant.actionOrientation)}</span>
                                </div>
                                <div className={styles.scoreItem}>
                                    <span>Market Awareness</span>
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${(applicant.marketAwareness || 0) * 100}%` }} />
                                    </div>
                                    <span>{formatScore(applicant.marketAwareness)}</span>
                                </div>
                                <div className={styles.scoreItem}>
                                    <span>Rejection Resilience</span>
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${(applicant.rejectionResilience || 0) * 100}%` }} />
                                    </div>
                                    <span>{formatScore(applicant.rejectionResilience)}</span>
                                </div>
                                <div className={styles.scoreItem}>
                                    <span>Commitment Signal</span>
                                    <div className={styles.scoreBar}>
                                        <div style={{ width: `${(applicant.commitmentSignal || 0) * 100}%` }} />
                                    </div>
                                    <span>{formatScore(applicant.commitmentSignal)}</span>
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
                                applicant.aiRecommendation === 'WAITLIST' ? 'badge-warning' :
                                    'badge-danger'
                                }`}>
                                {applicant.aiRecommendation === 'ADMIT' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {applicant.aiRecommendation}
                            </span>
                            {/* Structured Explanation */}
                            {applicant.aiRecommendation && (() => {
                                const rec = getRecommendationParts(applicant);
                                return (
                                    <div className={styles.explanationBox}>
                                        <p className={styles.explanationText}>{rec.summary}</p>
                                        {rec.strengths && (
                                            <div className={styles.explanationSection}>
                                                <span className={styles.explanationLabel}>✅ Strengths</span>
                                                <p className={styles.explanationText}>{rec.strengths}</p>
                                            </div>
                                        )}
                                        {rec.concerns && (
                                            <div className={styles.explanationSection}>
                                                <span className={styles.explanationLabel}>⚠️ Concerns</span>
                                                <p className={styles.explanationText}>{rec.concerns}</p>
                                            </div>
                                        )}
                                        <span className={styles.methodBadge}>{rec.method}</span>
                                    </div>
                                );
                            })()}
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

                    {/* Decision Panel — only for SCORED or WAITLIST applicants */}
                    {(applicant.status === 'SCORED' || applicant.status === 'WAITLIST') && (
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

                            {/* Rejection Reason — shows inline when considering rejection */}
                            <div className={styles.notesField}>
                                <label>Rejection Reason (required if rejecting)</label>
                                <select
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-sm)',
                                        border: '1px solid var(--border-subtle)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '14px',
                                        fontFamily: 'inherit',
                                        background: 'var(--bg-primary)',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <option value="">— Select reason (only for rejection) —</option>
                                    <option value="LOW_READINESS">Low Readiness</option>
                                    <option value="NO_DEVICE">No Device Access</option>
                                    <option value="NO_INTERNET">No Internet Access</option>
                                    <option value="NO_CONSENT">Did Not Consent</option>
                                    <option value="INCOMPLETE_FORM">Incomplete Form</option>
                                    <option value="DUPLICATE">Duplicate Application</option>
                                    <option value="STAFF_DECISION">Staff Decision</option>
                                </select>
                            </div>

                            <div className={styles.decisionButtons}>
                                <button
                                    className={styles.admitButton}
                                    onClick={() => handleDecision('ADMITTED')}
                                    disabled={decidingAction !== null}
                                >
                                    {decidingAction === 'ADMITTED' ? <Loader2 className={styles.spinner} size={16} /> : <Check size={16} />}
                                    Admit
                                </button>
                                <button
                                    className={styles.waitlistButton}
                                    onClick={() => handleDecision('WAITLIST')}
                                    disabled={decidingAction !== null}
                                >
                                    {decidingAction === 'WAITLIST' ? <Loader2 className={styles.spinner} size={16} /> : <Clock size={16} />}
                                    Waitlist
                                </button>
                                <button
                                    className={styles.rejectButton}
                                    onClick={() => handleDecision('REJECTED')}
                                    disabled={decidingAction !== null}
                                >
                                    {decidingAction === 'REJECTED' ? <Loader2 className={styles.spinner} size={16} /> : <X size={16} />}
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
