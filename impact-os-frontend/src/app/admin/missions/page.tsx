'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Search, MoreVertical, Clock, Users, CheckCircle2, Star, Zap, Trophy, Wrench, X, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { Select } from '@/components/ui/Select/Select';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Mock data for development
const MOCK_MISSIONS: Mission[] = [
    {
        id: 'mission-1',
        title: 'Complete Git & GitHub Fundamentals',
        description: 'Learn version control basics including commits, branches, and pull requests',
        skillDomain: 'TECHNICAL',
        difficulty: 'EASY',
        momentum: 15,
        skillXp: 50,
        arenaPoints: 0,
        requiredLevel: 'L1',
        isDaily: false,
        isWeekly: false,
        isActive: true,
        completionRate: 78,
        activeCount: 12,
        totalAssignments: 45,
    },
    {
        id: 'mission-2',
        title: 'Build a Personal Portfolio Website',
        description: 'Create a responsive portfolio showcasing your skills and projects',
        skillDomain: 'TECHNICAL',
        difficulty: 'MEDIUM',
        momentum: 25,
        skillXp: 120,
        arenaPoints: 5,
        requiredLevel: 'L2',
        isDaily: false,
        isWeekly: true,
        isActive: true,
        completionRate: 62,
        activeCount: 8,
        totalAssignments: 32,
    },
    {
        id: 'mission-3',
        title: 'Pitch Your Services (2 min)',
        description: 'Record a 2-minute elevator pitch for your freelance services',
        skillDomain: 'SOFT',
        difficulty: 'MEDIUM',
        momentum: 20,
        skillXp: 80,
        arenaPoints: 10,
        requiredLevel: 'L2',
        isDaily: false,
        isWeekly: false,
        isActive: true,
        completionRate: 45,
        activeCount: 5,
        totalAssignments: 28,
    },
    {
        id: 'mission-4',
        title: 'Cold Outreach to 5 Prospects',
        description: 'Send personalized cold emails to potential clients in your niche',
        skillDomain: 'COMMERCIAL',
        difficulty: 'HARD',
        momentum: 30,
        skillXp: 50,
        arenaPoints: 25,
        requiredLevel: 'L3',
        isDaily: false,
        isWeekly: true,
        isActive: true,
        completionRate: 34,
        activeCount: 15,
        totalAssignments: 52,
    },
    {
        id: 'mission-5',
        title: 'Daily Check-in Post',
        description: 'Share your daily progress on The Wall to maintain streak',
        skillDomain: 'SOFT',
        difficulty: 'EASY',
        momentum: 5,
        skillXp: 10,
        arenaPoints: 0,
        requiredLevel: 'L1',
        isDaily: true,
        isWeekly: false,
        isActive: true,
        completionRate: 89,
        activeCount: 25,
        totalAssignments: 180,
    },
    {
        id: 'mission-6',
        title: 'Complete First Paid Gig',
        description: 'Land and complete your first paid freelance project',
        skillDomain: 'COMMERCIAL',
        difficulty: 'HARD',
        momentum: 50,
        skillXp: 200,
        arenaPoints: 50,
        requiredLevel: 'L3',
        isDaily: false,
        isWeekly: false,
        isActive: false,
        completionRate: 12,
        activeCount: 0,
        totalAssignments: 8,
    },
];

const MOCK_STATS: MissionStats = {
    totalMissions: 6,
    activeMissions: 5,
    pendingReview: 3,
    inProgress: 42,
    avgCompletionRate: 53,
};

interface Mission {
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
    isActive: boolean;
    completionRate: number;
    activeCount: number;
    totalAssignments: number;
}

interface MissionStats {
    totalMissions: number;
    activeMissions: number;
    pendingReview: number;
    inProgress: number;
    avgCompletionRate: number;
}

interface CreateMissionForm {
    title: string;
    description: string;
    skillDomain: 'TECHNICAL' | 'SOFT' | 'COMMERCIAL';
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    momentum: number;
    skillXp: number;
    arenaPoints: number;
    isDaily: boolean;
    isWeekly: boolean;
}

const skillDomainLabels = {
    TECHNICAL: 'Technical',
    SOFT: 'Soft Skills',
    COMMERCIAL: 'Commercial',
};

const difficultyLabels = {
    EASY: 'Easy',
    MEDIUM: 'Medium',
    HARD: 'Hard',
};

export default function AdminMissionsPage() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [stats, setStats] = useState<MissionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [skillDomainFilter, setSkillDomainFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState<CreateMissionForm>({
        title: '',
        description: '',
        skillDomain: 'TECHNICAL',
        difficulty: 'EASY',
        momentum: 10,
        skillXp: 5,
        arenaPoints: 0,
        isDaily: false,
        isWeekly: false,
    });
    const [creating, setCreating] = useState(false);
    const [actionMenu, setActionMenu] = useState<string | null>(null);

    useEffect(() => {
        fetchMissions();
        fetchStats();
    }, []);

    const fetchMissions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/missions/all`);
            if (response.ok) {
                const data = await response.json();
                setMissions(data.length > 0 ? data : MOCK_MISSIONS);
            } else {
                // Use mock data if API fails
                setMissions(MOCK_MISSIONS);
            }
        } catch (error) {
            console.error('Failed to fetch missions, using mock data:', error);
            setMissions(MOCK_MISSIONS);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/missions/admin/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            } else {
                setStats(MOCK_STATS);
            }
        } catch (error) {
            console.error('Failed to fetch stats, using mock data:', error);
            setStats(MOCK_STATS);
        }
    };

    const handleCreateMission = async () => {
        if (!createForm.title || !createForm.description) return;

        setCreating(true);
        try {
            const response = await fetch(`${API_URL}/api/missions/admin/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm),
            });

            if (response.ok) {
                setShowCreateModal(false);
                setCreateForm({
                    title: '',
                    description: '',
                    skillDomain: 'TECHNICAL',
                    difficulty: 'EASY',
                    momentum: 10,
                    skillXp: 5,
                    arenaPoints: 0,
                    isDaily: false,
                    isWeekly: false,
                });
                fetchMissions();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to create mission:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleToggleStatus = async (missionId: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`${API_URL}/api/missions/admin/${missionId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (response.ok) {
                fetchMissions();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
        setActionMenu(null);
    };

    const filteredMissions = missions.filter((mission) => {
        const matchesSearch = mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mission.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDomain = skillDomainFilter === 'all' || mission.skillDomain === skillDomainFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && mission.isActive) ||
            (statusFilter === 'inactive' && !mission.isActive);
        return matchesSearch && matchesDomain && matchesStatus;
    });

    const getDifficultyStars = (difficulty: string) => {
        const count = difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 2 : 3;
        return Array(3).fill(0).map((_, i) => (
            <Star
                key={i}
                size={12}
                className={i < count ? styles.starFilled : styles.starEmpty}
            />
        ));
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <Loader2 className={styles.spinner} size={32} />
                <p>Loading missions...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Missions</h1>
                    <p>Manage mission templates and track completion rates</p>
                </div>
                <div className={styles.headerActions}>
                    <Link href="/admin/missions/reviews" className={styles.reviewsLink}>
                        <Clock size={18} />
                        Pending Reviews
                        {stats && stats.pendingReview > 0 && (
                            <span className={styles.badge}>{stats.pendingReview}</span>
                        )}
                    </Link>
                    <button className={styles.addButton} onClick={() => setShowCreateModal(true)}>
                        <Plus size={18} />
                        Create Mission
                    </button>
                </div>
            </header>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <Target size={20} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.totalMissions || 0}</span>
                        <span className={styles.statLabel}>Total Missions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <CheckCircle2 size={20} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.activeMissions || 0}</span>
                        <span className={styles.statLabel}>Active</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Users size={20} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.inProgress || 0}</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Trophy size={20} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats?.avgCompletionRate || 0}%</span>
                        <span className={styles.statLabel}>Avg Completion</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search missions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className={styles.filters}>
                    <Select
                        options={[
                            { value: 'all', label: 'All Domains' },
                            { value: 'TECHNICAL', label: 'Technical' },
                            { value: 'SOFT', label: 'Soft Skills' },
                            { value: 'COMMERCIAL', label: 'Commercial' },
                        ]}
                        value={skillDomainFilter}
                        onChange={setSkillDomainFilter}
                        placeholder="All Domains"
                    />
                    <Select
                        options={[
                            { value: 'all', label: 'All Status' },
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ]}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="All Status"
                    />
                </div>
            </div>

            {/* Missions Table - Desktop */}
            <div className={styles.tableContainer}>
                <table className={`${styles.table} hide-mobile`}>
                    <thead>
                        <tr>
                            <th>Mission</th>
                            <th>Domain</th>
                            <th>Difficulty</th>
                            <th>Rewards</th>
                            <th>Active</th>
                            <th>Completion</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMissions.map((mission) => (
                            <tr key={mission.id}>
                                <td>
                                    <div className={styles.missionCell}>
                                        <span className={styles.missionTitle}>{mission.title}</span>
                                        <span className={styles.missionDesc}>{mission.description}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${styles.domainTag} ${styles[mission.skillDomain.toLowerCase()]}`}>
                                        {skillDomainLabels[mission.skillDomain]}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.difficultyStars}>
                                        {getDifficultyStars(mission.difficulty)}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.rewardsCell}>
                                        {mission.momentum > 0 && (
                                            <span className={styles.rewardBadge}>
                                                <Zap size={12} /> {mission.momentum}
                                            </span>
                                        )}
                                        {mission.skillXp > 0 && (
                                            <span className={styles.rewardBadge}>
                                                <Wrench size={12} /> {mission.skillXp}
                                            </span>
                                        )}
                                        {mission.arenaPoints > 0 && (
                                            <span className={styles.rewardBadge}>
                                                <Trophy size={12} /> {mission.arenaPoints}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={styles.activeCount}>{mission.activeCount}</span>
                                </td>
                                <td>
                                    <div className={styles.completionCell}>
                                        <div className={styles.completionBar}>
                                            <div
                                                className={styles.completionFill}
                                                style={{ width: `${mission.completionRate}%` }}
                                            />
                                        </div>
                                        <span>{mission.completionRate}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${styles.statusTag} ${mission.isActive ? styles.active : styles.inactive}`}>
                                        {mission.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.actionContainer}>
                                        <button
                                            className={styles.moreButton}
                                            onClick={() => setActionMenu(actionMenu === mission.id ? null : mission.id)}
                                        >
                                            <MoreVertical size={18} />
                                        </button>
                                        {actionMenu === mission.id && (
                                            <div className={styles.actionMenu}>
                                                <button onClick={() => handleToggleStatus(mission.id, mission.isActive)}>
                                                    {mission.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    {mission.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Card View */}
                <div className={`${styles.mobileCards} show-mobile`}>
                    {filteredMissions.map((mission) => (
                        <div key={mission.id} className={styles.missionCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.cardTitle}>
                                    <span className={styles.missionTitle}>{mission.title}</span>
                                    <span className={`${styles.statusTag} ${mission.isActive ? styles.active : styles.inactive}`}>
                                        {mission.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className={styles.cardMeta}>
                                    <span className={`${styles.domainTag} ${styles[mission.skillDomain.toLowerCase()]}`}>
                                        {skillDomainLabels[mission.skillDomain]}
                                    </span>
                                    <div className={styles.difficultyStars}>
                                        {getDifficultyStars(mission.difficulty)}
                                    </div>
                                </div>
                            </div>
                            <p className={styles.cardDesc}>{mission.description}</p>
                            <div className={styles.cardStats}>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardLabel}>Rewards</span>
                                    <div className={styles.rewardsCell}>
                                        {mission.momentum > 0 && (
                                            <span className={styles.rewardBadge}>
                                                <Zap size={12} /> {mission.momentum}
                                            </span>
                                        )}
                                        {mission.skillXp > 0 && (
                                            <span className={styles.rewardBadge}>
                                                <Wrench size={12} /> {mission.skillXp}
                                            </span>
                                        )}
                                        {mission.arenaPoints > 0 && (
                                            <span className={styles.rewardBadge}>
                                                <Trophy size={12} /> {mission.arenaPoints}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardLabel}>Active</span>
                                    <span className={styles.cardValue}>{mission.activeCount}</span>
                                </div>
                                <div className={styles.cardStat}>
                                    <span className={styles.cardLabel}>Completion</span>
                                    <div className={styles.completionCell}>
                                        <div className={styles.completionBar}>
                                            <div
                                                className={styles.completionFill}
                                                style={{ width: `${mission.completionRate}%` }}
                                            />
                                        </div>
                                        <span>{mission.completionRate}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.cardActions}>
                                <button
                                    className={styles.cardActionBtn}
                                    onClick={() => handleToggleStatus(mission.id, mission.isActive)}
                                >
                                    {mission.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                    {mission.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredMissions.length === 0 && (
                    <div className={styles.emptyState}>
                        <Target size={48} />
                        <p>No missions found</p>
                    </div>
                )}
            </div>

            {/* Create Mission Modal */}
            {showCreateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Create Mission</h2>
                            <button onClick={() => setShowCreateModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={createForm.title}
                                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                                    placeholder="Mission title..."
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Description</label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    placeholder="What should the participant do?"
                                    rows={3}
                                />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Skill Domain</label>
                                    <Select
                                        options={[
                                            { value: 'TECHNICAL', label: 'Technical' },
                                            { value: 'SOFT', label: 'Soft Skills' },
                                            { value: 'COMMERCIAL', label: 'Commercial' },
                                        ]}
                                        value={createForm.skillDomain}
                                        onChange={(v) => setCreateForm({ ...createForm, skillDomain: v as any })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Difficulty</label>
                                    <Select
                                        options={[
                                            { value: 'EASY', label: 'Easy' },
                                            { value: 'MEDIUM', label: 'Medium' },
                                            { value: 'HARD', label: 'Hard' },
                                        ]}
                                        value={createForm.difficulty}
                                        onChange={(v) => setCreateForm({ ...createForm, difficulty: v as any })}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Momentum <Zap size={12} /></label>
                                    <input
                                        type="number"
                                        value={createForm.momentum}
                                        onChange={(e) => setCreateForm({ ...createForm, momentum: parseInt(e.target.value) || 0 })}
                                        min={0}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Skill XP <Wrench size={12} /></label>
                                    <input
                                        type="number"
                                        value={createForm.skillXp}
                                        onChange={(e) => setCreateForm({ ...createForm, skillXp: parseInt(e.target.value) || 0 })}
                                        min={0}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Arena Points <Trophy size={12} /></label>
                                    <input
                                        type="number"
                                        value={createForm.arenaPoints}
                                        onChange={(e) => setCreateForm({ ...createForm, arenaPoints: parseInt(e.target.value) || 0 })}
                                        min={0}
                                    />
                                </div>
                            </div>
                            <div className={styles.formRow}>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={createForm.isDaily}
                                        onChange={(e) => setCreateForm({ ...createForm, isDaily: e.target.checked })}
                                    />
                                    Daily Mission
                                </label>
                                <label className={styles.checkbox}>
                                    <input
                                        type="checkbox"
                                        checked={createForm.isWeekly}
                                        onChange={(e) => setCreateForm({ ...createForm, isWeekly: e.target.checked })}
                                    />
                                    Weekly Mission
                                </label>
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button type="button" className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={styles.createBtn}
                                onClick={handleCreateMission}
                                disabled={creating || !createForm.title || !createForm.description}
                            >
                                {creating ? <Loader2 className={styles.spinner} size={16} /> : 'Create Mission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
