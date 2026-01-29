// API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Generic fetch wrapper with error handling
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// ===== MISSION API =====

export interface Mission {
    id: string;
    title: string;
    description: string;
    skillDomain: 'TECHNICAL' | 'SOFT' | 'COMMERCIAL';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    momentum: number;
    skillXp: number;
    arenaPoints: number;
    requiredLevel: string;
    isDaily: boolean;
    isWeekly: boolean;
}

export interface MissionAssignment {
    id: string;
    missionId: string;
    userId: string;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
    progress?: number;
    deadlineAt?: string;
    startedAt?: string;
    completedAt?: string;
    mission: Mission;
}

export const missionApi = {
    getAvailable: (userId: string) =>
        apiFetch<Mission[]>(`/missions/${userId}/available`),

    getUserMissions: (userId: string, status?: string) =>
        apiFetch<MissionAssignment[]>(`/missions/${userId}${status ? `?status=${status}` : ''}`),

    getActive: (userId: string) =>
        apiFetch<MissionAssignment[]>(`/missions/${userId}/active`),

    getStats: (userId: string) =>
        apiFetch<{ completed: number; inProgress: number; assigned: number; expired: number; failed: number }>(`/missions/${userId}/stats`),

    assign: (userId: string, missionId: string, deadlineDays?: number) =>
        apiFetch<MissionAssignment>(`/missions/${userId}/assign/${missionId}`, {
            method: 'POST',
            body: JSON.stringify({ deadlineDays }),
        }),

    start: (userId: string, assignmentId: string) =>
        apiFetch<MissionAssignment>(`/missions/${userId}/start/${assignmentId}`, {
            method: 'POST',
        }),

    submit: (userId: string, assignmentId: string, proof?: { proofUrl?: string; proofText?: string }) =>
        apiFetch<MissionAssignment>(`/missions/${userId}/submit/${assignmentId}`, {
            method: 'POST',
            body: JSON.stringify(proof || {}),
        }),
};

// ===== CURRENCY API =====

export interface CurrencyBalance {
    momentum: number;
    skillXp: number;
    arenaPoints: number;
    incomeProof: number;
}

export interface Transaction {
    id: string;
    currencyType: 'MOMENTUM' | 'SKILL_XP' | 'ARENA_POINTS' | 'INCOME_PROOF';
    amount: number;
    reason: string;
    missionId?: string;
    createdAt: string;
}

export interface SkillTriad {
    technical: number;
    soft: number;
    commercial: number;
    isBalanced: boolean;
    totalXp: number;
    arenaPoints: number;
}

export const currencyApi = {
    getBalance: (userId: string) =>
        apiFetch<CurrencyBalance>(`/currency/${userId}/balance`),

    getHistory: (userId: string, type?: string, limit?: number) =>
        apiFetch<Transaction[]>(`/currency/${userId}/history?${type ? `type=${type}&` : ''}limit=${limit || 50}`),

    getTriad: (userId: string) =>
        apiFetch<SkillTriad>(`/currency/${userId}/triad`),
};

// ===== STIPEND API =====

export interface StipendStatus {
    eligible: boolean;
    reason?: string;
    amount: number;
    tier: 'NONE' | 'BASE' | 'STANDARD' | 'BONUS';
    momentum: number;
    daysActive: number;
    recentTransactions: Transaction[];
}

export const stipendApi = {
    getStatus: (userId: string) =>
        apiFetch<StipendStatus>(`/stipend/${userId}/status`),

    getEligibility: (userId: string) =>
        apiFetch<Omit<StipendStatus, 'recentTransactions'>>(`/stipend/${userId}/eligibility`),

    reactivate: (userId: string) =>
        apiFetch<{ success: boolean }>(`/stipend/${userId}/reactivate`, {
            method: 'POST',
        }),
};

// ===== INCOME API =====

export interface IncomeRecord {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    source: 'FREELANCE' | 'CLIENT_WORK' | 'RETAINER' | 'CONTENT_PAYMENT' | 'OTHER';
    platform?: string;
    description?: string;
    proofUrl?: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
    earnedAt: string;
    verifiedAt?: string;
    rejectionReason?: string;
}

export interface SubmitIncomeDto {
    amount: number;
    currency?: string;
    source: string;
    platform?: string;
    description?: string;
    proofUrl?: string;
    earnedAt?: string;
}

export const incomeApi = {
    getRecords: (userId: string) =>
        apiFetch<IncomeRecord[]>(`/income/${userId}`),

    submit: (userId: string, data: SubmitIncomeDto) =>
        apiFetch<IncomeRecord>(`/income/${userId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getStats: (userId: string) =>
        apiFetch<{ totalVerified: number; pendingReview: number; totalRecords: number }>(`/income/${userId}/stats`),
};

// Export all APIs
export const api = {
    missions: missionApi,
    currency: currencyApi,
    stipend: stipendApi,
    income: incomeApi,
};
