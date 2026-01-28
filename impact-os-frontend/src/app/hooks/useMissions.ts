'use client';

import { useState, useEffect, useCallback } from 'react';
import { missionApi, Mission, MissionAssignment } from '../lib/api';
import { useUser } from '../context/UserContext';

// Hook for fetching available missions
export function useAvailableMissions() {
    const { user } = useUser();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await missionApi.getAvailable(user.id);
            setMissions(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch missions');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { missions, loading, error, refetch: fetch };
}

// Hook for fetching user's mission assignments
export function useUserMissions(status?: string) {
    const { user } = useUser();
    const [assignments, setAssignments] = useState<MissionAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const data = await missionApi.getUserMissions(user.id, status);
            setAssignments(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch missions');
        } finally {
            setLoading(false);
        }
    }, [user?.id, status]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { assignments, loading, error, refetch: fetch };
}

// Hook for mission stats
export function useMissionStats() {
    const { user } = useUser();
    const [stats, setStats] = useState({ completed: 0, inProgress: 0, assigned: 0, expired: 0, failed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;

        missionApi.getStats(user.id)
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.id]);

    return { stats, loading };
}

// Hook for mission actions
export function useMissionActions() {
    const { user } = useUser();
    const [loading, setLoading] = useState(false);

    const startMission = async (missionId: string): Promise<MissionAssignment | null> => {
        if (!user?.id) return null;

        setLoading(true);
        try {
            // First assign, then start
            const assignment = await missionApi.assign(user.id, missionId);
            const started = await missionApi.start(user.id, assignment.id);
            return started;
        } catch (err) {
            console.error('Failed to start mission:', err);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const submitMission = async (assignmentId: string, proof?: { proofUrl?: string; proofText?: string }): Promise<boolean> => {
        if (!user?.id) return false;

        setLoading(true);
        try {
            await missionApi.submit(user.id, assignmentId, proof);
            return true;
        } catch (err) {
            console.error('Failed to submit mission:', err);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { startMission, submitMission, loading };
}
