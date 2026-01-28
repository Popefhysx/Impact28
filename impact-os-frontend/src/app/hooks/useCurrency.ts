'use client';

import { useState, useEffect, useCallback } from 'react';
import { currencyApi, CurrencyBalance, Transaction, SkillTriad } from '../lib/api';
import { useUser } from '../context/UserContext';

// Hook for currency balance
export function useCurrencyBalance() {
    const { user } = useUser();
    const [balance, setBalance] = useState<CurrencyBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await currencyApi.getBalance(user.id);
            setBalance(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch balance');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { balance, loading, error, refetch: fetch };
}

// Hook for transaction history
export function useTransactionHistory(currencyType?: string, limit: number = 50) {
    const { user } = useUser();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await currencyApi.getHistory(user.id, currencyType, limit);
            setTransactions(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        } finally {
            setLoading(false);
        }
    }, [user?.id, currencyType, limit]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { transactions, loading, error, refetch: fetch };
}

// Hook for skill triad scores
export function useSkillTriad() {
    const { user } = useUser();
    const [triad, setTriad] = useState<SkillTriad | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await currencyApi.getTriad(user.id);
            setTriad(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch skill triad');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { triad, loading, error, refetch: fetch };
}
