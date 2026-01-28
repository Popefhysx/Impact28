'use client';

import { useState, useEffect, useCallback } from 'react';
import { stipendApi, StipendStatus } from '../lib/api';
import { useUser } from '../context/UserContext';

// Hook for stipend status
export function useStipendStatus() {
    const { user } = useUser();
    const [status, setStatus] = useState<StipendStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await stipendApi.getStatus(user.id);
            setStatus(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch stipend status');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { status, loading, error, refetch: fetch };
}

// Hook for reactivation action
export function useStipendActions() {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);

    const reactivate = async (): Promise<boolean> => {
        if (!user?.id) return false;

        setLoading(true);
        try {
            const result = await stipendApi.reactivate(user.id);
            return result.success;
        } catch (err) {
            console.error('Failed to reactivate:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { reactivate, loading };
}
