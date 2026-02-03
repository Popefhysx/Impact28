'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    whatsapp?: string;
    identityLevel: string;
    skillTrack?: string;
    avatarUrl?: string;
    bio?: string;
    cohortId?: string;
    isActive: boolean;
}

export interface CurrencyBalance {
    momentum: number;
    skillXp: number;
    arenaPoints: number;
    incomeProof: number;
}

export interface SkillTriad {
    technical: number;
    soft: number;
    commercial: number;
    isBalanced: boolean;
}

interface UserContextType {
    user: User | null;
    balance: CurrencyBalance | null;
    triad: SkillTriad | null;
    loading: boolean;
    error: string | null;
    refreshUser: () => Promise<void>;
    refreshBalance: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// API base URL - will connect to backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Mock user for development (will be replaced by real auth)
const MOCK_USER: User = {
    id: 'user-001',
    email: 'adewale.j@email.com',
    firstName: 'Adewale',
    lastName: 'Johnson',
    whatsapp: '+234 801 234 5678',
    identityLevel: 'L2_SKILLED',
    skillTrack: 'GRAPHIC_DESIGN',
    cohortId: 'cohort-12',
    isActive: true,
    bio: 'Aspiring graphic designer focused on brand identity and social media graphics.',
};

const MOCK_BALANCE: CurrencyBalance = {
    momentum: 78,
    skillXp: 1250,
    arenaPoints: 340,
    incomeProof: 0,
};

const MOCK_TRIAD: SkillTriad = {
    technical: 65,
    soft: 55,
    commercial: 35,
    isBalanced: false,
};

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [balance, setBalance] = useState<CurrencyBalance | null>(null);
    const [triad, setTriad] = useState<SkillTriad | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        try {
            // TODO: Replace with real API call
            // const response = await fetch(`${API_BASE}/users/me`);
            // const data = await response.json();
            // setUser(data);

            // Using mock data for now
            setUser(MOCK_USER);
        } catch (err) {
            setError('Failed to load user data');
            console.error('Error fetching user:', err);
        }
    };

    const fetchBalance = async () => {
        if (!user?.id) return;

        try {
            // TODO: Replace with real API call
            // const response = await fetch(`${API_BASE}/currency/${user.id}/balance`);
            // const data = await response.json();
            // setBalance(data);

            // Using mock data for now
            setBalance(MOCK_BALANCE);
        } catch (err) {
            console.error('Error fetching balance:', err);
        }
    };

    const fetchTriad = async () => {
        if (!user?.id) return;

        try {
            // TODO: Replace with real API call
            // const response = await fetch(`${API_BASE}/currency/${user.id}/triad`);
            // const data = await response.json();
            // setTriad(data);

            // Using mock data for now
            setTriad(MOCK_TRIAD);
        } catch (err) {
            console.error('Error fetching triad:', err);
        }
    };

    const refreshUser = async () => {
        setLoading(true);
        await fetchUser();
        setLoading(false);
    };

    const refreshBalance = async () => {
        await fetchBalance();
        await fetchTriad();
    };

    useEffect(() => {
        const init = async () => {
            await fetchUser();
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (user) {
            fetchBalance();
            fetchTriad();
        }
    }, [user]);

    return (
        <UserContext.Provider value={{
            user,
            balance,
            triad,
            loading,
            error,
            refreshUser,
            refreshBalance
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
