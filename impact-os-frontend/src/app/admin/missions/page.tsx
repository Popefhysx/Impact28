'use client';

import { useState, useEffect } from 'react';
import { Target, Plus, Search, Filter, MoreVertical, Clock, Users, CheckCircle2, AlertCircle, Star, Zap, Trophy, Wrench } from 'lucide-react';
import styles from './page.module.css';

interface Mission {
    id: string;
    title: string;
    description: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    phase: 'ONBOARDING' | 'SKILL_BUILDING' | 'MARKET_EXPOSURE' | 'INCOME_GENERATION';
    currencyReward: {
        type: 'MOMENTUM' | 'SKILL_XP' | 'ARENA_POINTS';
        amount: number;
    };
    completionRate: number;
    activeCount: number;
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}

const mockMissions: Mission[] = [
    {
        id: '1',
        title: 'Complete Profile Setup',
        description: 'Fill in all required profile fields including skills and availability',
        difficulty: 1,
        phase: 'ONBOARDING',
        currencyReward: { type: 'MOMENTUM', amount: 10 },
        completionRate: 92,
        activeCount: 15,
        status: 'ACTIVE',
    },
    {
        id: '2',
        title: 'First Skill Module',
        description: 'Complete the first module in your selected skill track',
        difficulty: 2,
        phase: 'SKILL_BUILDING',
        currencyReward: { type: 'SKILL_XP', amount: 50 },
        completionRate: 78,
        activeCount: 42,
        status: 'ACTIVE',
    },
    {
        id: '3',
        title: 'First Outreach',
        description: 'Contact 3 potential clients or employers about your services',
        difficulty: 3,
        phase: 'MARKET_EXPOSURE',
        currencyReward: { type: 'ARENA_POINTS', amount: 15 },
        completionRate: 45,
        activeCount: 28,
        status: 'ACTIVE',
    },
    {
        id: '4',
        title: 'Portfolio Review',
        description: 'Submit your portfolio for mentor review and implement feedback',
        difficulty: 2,
        phase: 'SKILL_BUILDING',
        currencyReward: { type: 'SKILL_XP', amount: 75 },
        completionRate: 62,
        activeCount: 19,
        status: 'ACTIVE',
    },
    {
        id: '5',
        title: 'Cold Outreach Challenge',
        description: 'Reach out to 10 prospects in one week and log all responses',
        difficulty: 4,
        phase: 'MARKET_EXPOSURE',
        currencyReward: { type: 'ARENA_POINTS', amount: 30 },
        completionRate: 34,
        activeCount: 12,
        status: 'ACTIVE',
    },
    {
        id: '6',
        title: 'First Client Meeting',
        description: 'Schedule and complete a discovery call with a potential client',
        difficulty: 4,
        phase: 'INCOME_GENERATION',
        currencyReward: { type: 'ARENA_POINTS', amount: 25 },
        completionRate: 28,
        activeCount: 8,
        status: 'ACTIVE',
    },
];

const phaseLabels = {
    ONBOARDING: 'Onboarding',
    SKILL_BUILDING: 'Skill Building',
    MARKET_EXPOSURE: 'Market Exposure',
    INCOME_GENERATION: 'Income Generation',
};

const currencyIcons = {
    MOMENTUM: Zap,
    SKILL_XP: Wrench,
    ARENA_POINTS: Trophy,
};

export default function AdminMissionsPage() {
    const [missions, setMissions] = useState<Mission[]>(mockMissions);
    const [searchQuery, setSearchQuery] = useState('');
    const [phaseFilter, setPhaseFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredMissions = missions.filter((mission) => {
        const matchesSearch = mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mission.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPhase = phaseFilter === 'all' || mission.phase === phaseFilter;
        const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
        return matchesSearch && matchesPhase && matchesStatus;
    });

    // Calculate stats
    const stats = {
        total: missions.length,
        active: missions.filter(m => m.status === 'ACTIVE').length,
        avgCompletionRate: Math.round(missions.reduce((acc, m) => acc + m.completionRate, 0) / missions.length),
        totalActive: missions.reduce((acc, m) => acc + m.activeCount, 0),
    };

    const getDifficultyStars = (difficulty: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                size={12}
                className={i < difficulty ? styles.starFilled : styles.starEmpty}
            />
        ));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Missions</h1>
                    <p>Manage mission templates and track completion rates</p>
                </div>
                <button className={styles.addButton}>
                    <Plus size={18} />
                    Create Mission
                </button>
            </header>

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statCard}>
                    <Target size={20} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.total}</span>
                        <span className={styles.statLabel}>Total Missions</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <CheckCircle2 size={20} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.active}</span>
                        <span className={styles.statLabel}>Active</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Users size={20} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.totalActive}</span>
                        <span className={styles.statLabel}>In Progress</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <Trophy size={20} className={styles.statIcon} />
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{stats.avgCompletionRate}%</span>
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
                    <select
                        value={phaseFilter}
                        onChange={(e) => setPhaseFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Phases</option>
                        <option value="ONBOARDING">Onboarding</option>
                        <option value="SKILL_BUILDING">Skill Building</option>
                        <option value="MARKET_EXPOSURE">Market Exposure</option>
                        <option value="INCOME_GENERATION">Income Generation</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DRAFT">Draft</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>
                </div>
            </div>

            {/* Missions Table */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mission</th>
                            <th>Phase</th>
                            <th>Difficulty</th>
                            <th>Reward</th>
                            <th>Active</th>
                            <th>Completion</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMissions.map((mission) => {
                            const CurrencyIcon = currencyIcons[mission.currencyReward.type];
                            return (
                                <tr key={mission.id}>
                                    <td>
                                        <div className={styles.missionCell}>
                                            <span className={styles.missionTitle}>{mission.title}</span>
                                            <span className={styles.missionDesc}>{mission.description}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.phaseTag} ${styles[mission.phase.toLowerCase()]}`}>
                                            {phaseLabels[mission.phase]}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.difficultyStars}>
                                            {getDifficultyStars(mission.difficulty)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.rewardCell}>
                                            <CurrencyIcon size={16} />
                                            <span>+{mission.currencyReward.amount}</span>
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
                                        <span className={`${styles.statusTag} ${styles[mission.status.toLowerCase()]}`}>
                                            {mission.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className={styles.moreButton}>
                                            <MoreVertical size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
