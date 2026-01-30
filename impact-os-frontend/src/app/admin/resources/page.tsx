'use client';

import { useState, useEffect } from 'react';
import { Book, ExternalLink, Video, FileText, Podcast, LayoutGrid, List, Search, Plus, Trash2, Check, X, Loader2, Link } from 'lucide-react';
import { Select } from '@/components/ui/Select/Select';
import styles from './page.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Resource {
    id: string;
    title: string;
    author?: string;
    description?: string;
    url: string;
    type: 'BOOK' | 'ARTICLE' | 'VIDEO' | 'PODCAST' | 'BLOG';
    thumbnail?: string;
    skillTracks: string[];
    tags: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

interface Stats {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    byType: Record<string, number>;
}

const typeIcons: Record<string, any> = {
    BOOK: Book,
    ARTICLE: FileText,
    VIDEO: Video,
    PODCAST: Podcast,
    BLOG: FileText,
};

const typeLabels: Record<string, string> = {
    BOOK: 'Book',
    ARTICLE: 'Article',
    VIDEO: 'Video',
    PODCAST: 'Podcast',
    BLOG: 'Blog',
};

const skillTrackLabels: Record<string, string> = {
    GRAPHICS_DESIGN: 'Graphics Design',
    DIGITAL_MARKETING: 'Digital Marketing',
    WEB_DESIGN: 'Web Design',
    VIDEO_PRODUCTION: 'Video Production',
    AI_FOR_BUSINESS: 'AI for Business',
    MUSIC_PRODUCTION: 'Music Production',
};

type ViewMode = 'grid' | 'list';

// Sample resources for fallback
const sampleResources: Resource[] = [
    {
        id: '1',
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        description: 'Timeless lessons on wealth, greed, and happiness.',
        url: 'https://www.amazon.com/Psychology-Money-Timeless-lessons-happiness/dp/0857197681',
        type: 'BOOK',
        skillTracks: [],
        tags: ['finance', 'mindset'],
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Steal Like an Artist',
        author: 'Austin Kleon',
        description: '10 things nobody told you about being creative.',
        url: 'https://austinkleon.com/steal/',
        type: 'BOOK',
        skillTracks: ['GRAPHICS_DESIGN'],
        tags: ['creativity', 'art'],
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
    },
    {
        id: '3',
        title: 'Seth\'s Blog',
        author: 'Seth Godin',
        description: 'Daily insights on marketing, leadership, and making change happen.',
        url: 'https://seths.blog/',
        type: 'BLOG',
        skillTracks: ['DIGITAL_MARKETING'],
        tags: ['marketing', 'leadership'],
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
    },
    {
        id: '4',
        title: 'Refactoring UI',
        author: 'Adam Wathan & Steve Schoger',
        description: 'Learn design from a developer\'s perspective.',
        url: 'https://www.refactoringui.com/',
        type: 'BOOK',
        skillTracks: ['GRAPHICS_DESIGN', 'WEB_DESIGN'],
        tags: ['design', 'ui'],
        status: 'APPROVED',
        createdAt: new Date().toISOString(),
    },
];

export default function AdminResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');
    const [filterSkillTrack, setFilterSkillTrack] = useState('ALL');
    const [search, setSearch] = useState('');

    // Add Resource Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const [fetchingMetadata, setFetchingMetadata] = useState(false);
    const [newResource, setNewResource] = useState<Partial<Resource>>({
        type: 'ARTICLE',
        skillTracks: [],
        tags: [],
    });

    useEffect(() => {
        fetchResources();
        fetchStats();
    }, []);

    const fetchResources = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/resources`);
            if (response.ok) {
                const data = await response.json();
                setResources(data.length > 0 ? data : sampleResources);
            } else {
                setResources(sampleResources);
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error);
            setResources(sampleResources);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/resources/stats`);
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchUrlMetadata = async () => {
        if (!urlInput.trim()) return;

        setFetchingMetadata(true);
        try {
            const response = await fetch(`${API_URL}/admin/resources/fetch-metadata`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urlInput }),
            });

            if (response.ok) {
                const metadata = await response.json();
                setNewResource(prev => ({
                    ...prev,
                    ...metadata,
                    url: urlInput,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
            setNewResource(prev => ({ ...prev, url: urlInput }));
        } finally {
            setFetchingMetadata(false);
        }
    };

    const createResource = async () => {
        try {
            const response = await fetch(`${API_URL}/admin/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newResource),
            });

            if (response.ok) {
                setShowAddModal(false);
                setUrlInput('');
                setNewResource({ type: 'ARTICLE', skillTracks: [], tags: [] });
                fetchResources();
                fetchStats();
            }
        } catch (error) {
            console.error('Failed to create resource:', error);
        }
    };

    const approveResource = async (id: string) => {
        try {
            await fetch(`${API_URL}/admin/resources/${id}/approve`, { method: 'PATCH' });
            fetchResources();
            fetchStats();
        } catch (error) {
            console.error('Failed to approve resource:', error);
        }
    };

    const rejectResource = async (id: string) => {
        try {
            await fetch(`${API_URL}/admin/resources/${id}/reject`, { method: 'PATCH' });
            fetchResources();
            fetchStats();
        } catch (error) {
            console.error('Failed to reject resource:', error);
        }
    };

    const deleteResource = async (id: string) => {
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            await fetch(`${API_URL}/admin/resources/${id}`, { method: 'DELETE' });
            fetchResources();
            fetchStats();
        } catch (error) {
            console.error('Failed to delete resource:', error);
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
        const matchesType = filterType === 'ALL' || r.type === filterType;
        const matchesSkillTrack = filterSkillTrack === 'ALL' ||
            r.skillTracks?.includes(filterSkillTrack);
        const matchesSearch = search === '' ||
            r.title?.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase()) ||
            r.author?.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesType && matchesSkillTrack && matchesSearch;
    });

    // Filter options
    const statusOptions = [
        { value: 'ALL', label: 'All Status' },
        { value: 'PENDING', label: 'Pending' },
        { value: 'APPROVED', label: 'Approved' },
        { value: 'REJECTED', label: 'Rejected' },
    ];

    const typeOptions = [
        { value: 'ALL', label: 'All Types' },
        { value: 'BOOK', label: 'Books' },
        { value: 'ARTICLE', label: 'Articles' },
        { value: 'VIDEO', label: 'Videos' },
        { value: 'PODCAST', label: 'Podcasts' },
        { value: 'BLOG', label: 'Blogs' },
    ];

    const skillTrackOptions = [
        { value: 'ALL', label: 'All Skill Tracks' },
        ...Object.entries(skillTrackLabels).map(([value, label]) => ({ value, label })),
    ];

    const resourceTypeOptions = [
        { value: 'BOOK', label: 'Book' },
        { value: 'ARTICLE', label: 'Article' },
        { value: 'VIDEO', label: 'Video' },
        { value: 'PODCAST', label: 'Podcast' },
        { value: 'BLOG', label: 'Blog' },
    ];

    if (loading) {
        return (
            <div className={styles.loading}>
                <Loader2 className={styles.spinner} size={32} />
                <p>Loading resources...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1>Resource Management</h1>
                    <p>Manage books, articles, and videos for participants</p>
                </div>
                <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
                    <Plus size={18} />
                    Add Resource
                </button>
            </header>

            {/* Stats */}
            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{stats?.total || resources.length}</span>
                    <span className={styles.statLabel}>Total</span>
                </div>
                <div className={`${styles.stat} ${styles.pending}`}>
                    <span className={styles.statValue}>{stats?.pending || resources.filter(r => r.status === 'PENDING').length}</span>
                    <span className={styles.statLabel}>Pending</span>
                </div>
                <div className={`${styles.stat} ${styles.approved}`}>
                    <span className={styles.statValue}>{stats?.approved || resources.filter(r => r.status === 'APPROVED').length}</span>
                    <span className={styles.statLabel}>Approved</span>
                </div>
                <div className={`${styles.stat} ${styles.rejected}`}>
                    <span className={styles.statValue}>{stats?.rejected || resources.filter(r => r.status === 'REJECTED').length}</span>
                    <span className={styles.statLabel}>Rejected</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className={styles.filterRow}>
                    <div className={styles.selectWrapper}>
                        <Select
                            options={statusOptions}
                            value={filterStatus}
                            onChange={setFilterStatus}
                            placeholder="Status"
                        />
                    </div>
                    <div className={styles.selectWrapper}>
                        <Select
                            options={typeOptions}
                            value={filterType}
                            onChange={setFilterType}
                            placeholder="Type"
                        />
                    </div>
                    <div className={styles.selectWrapper}>
                        <Select
                            options={skillTrackOptions}
                            value={filterSkillTrack}
                            onChange={setFilterSkillTrack}
                            placeholder="Skill Track"
                        />
                    </div>
                </div>

                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button
                        className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Resources Table/Grid - Desktop uses viewMode, Mobile always uses cards */}
            {/* Desktop View */}
            <div className={styles.desktopView}>
                {viewMode === 'list' ? (
                    <div className={styles.table}>
                        <div className={styles.tableHeader}>
                            <span>Title</span>
                            <span>Type</span>
                            <span>Status</span>
                            <span>Track</span>
                            <span>Actions</span>
                        </div>
                        {filteredResources.map(resource => {
                            const Icon = typeIcons[resource.type] || FileText;
                            return (
                                <div key={resource.id} className={styles.tableRow}>
                                    <div className={styles.titleCell}>
                                        <Icon size={18} className={styles.typeIcon} />
                                        <div>
                                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                                {resource.title || 'Untitled'}
                                            </a>
                                            {resource.author && <span className={styles.author}>by {resource.author}</span>}
                                        </div>
                                    </div>
                                    <span className={styles.typeBadge}>{typeLabels[resource.type] || resource.type}</span>
                                    <span className={`${styles.statusBadge} ${styles[resource.status.toLowerCase()]}`}>
                                        {resource.status}
                                    </span>
                                    <div className={styles.trackBadges}>
                                        {resource.skillTracks?.slice(0, 1).map((track, i) => (
                                            <span key={i} className={styles.trackBadge}>
                                                {skillTrackLabels[track]?.split(' ')[0] || track}
                                            </span>
                                        ))}
                                    </div>
                                    <div className={styles.actions}>
                                        {resource.status === 'PENDING' && (
                                            <>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                    title="Approve"
                                                    onClick={() => approveResource(resource.id)}
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                    title="Reject"
                                                    onClick={() => rejectResource(resource.id)}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            title="Delete"
                                            onClick={() => deleteResource(resource.id)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filteredResources.map(resource => {
                            const Icon = typeIcons[resource.type] || FileText;
                            return (
                                <div key={resource.id} className={styles.gridCard}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.cardBadge}>
                                            <Icon size={14} />
                                            {typeLabels[resource.type] || resource.type}
                                        </span>
                                        <span className={`${styles.statusBadge} ${styles[resource.status.toLowerCase()]}`}>
                                            {resource.status}
                                        </span>
                                    </div>
                                    <h3>{resource.title || 'Untitled'}</h3>
                                    {resource.author && <p className={styles.cardAuthor}>by {resource.author}</p>}
                                    <p className={styles.cardDesc}>{resource.description || 'No description'}</p>
                                    <div className={styles.cardFooter}>
                                        <div className={styles.cardActions}>
                                            {resource.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => approveResource(resource.id)} className={styles.approveBtn}>
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button onClick={() => rejectResource(resource.id)} className={styles.rejectBtn}>
                                                        <X size={14} /> Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.visitLink}>
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Mobile View - Always cards */}
            <div className={styles.mobileCards}>
                {filteredResources.map(resource => {
                    const Icon = typeIcons[resource.type] || FileText;
                    return (
                        <div key={resource.id} className={styles.gridCard}>
                            <div className={styles.cardHeader}>
                                <span className={styles.cardBadge}>
                                    <Icon size={14} />
                                    {typeLabels[resource.type] || resource.type}
                                </span>
                                <span className={`${styles.statusBadge} ${styles[resource.status.toLowerCase()]}`}>
                                    {resource.status}
                                </span>
                            </div>
                            <h3>{resource.title || 'Untitled'}</h3>
                            {resource.author && <p className={styles.cardAuthor}>by {resource.author}</p>}
                            <p className={styles.cardDesc}>{resource.description || 'No description'}</p>
                            <div className={styles.cardFooter}>
                                <div className={styles.cardActions}>
                                    {resource.status === 'PENDING' && (
                                        <>
                                            <button onClick={() => approveResource(resource.id)} className={styles.approveBtn}>
                                                <Check size={14} /> Approve
                                            </button>
                                            <button onClick={() => rejectResource(resource.id)} className={styles.rejectBtn}>
                                                <X size={14} /> Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.visitLink}>
                                    <ExternalLink size={14} />
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredResources.length === 0 && (
                <div className={styles.empty}>
                    <p>No resources found.</p>
                </div>
            )}

            {/* Add Resource Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Add Resource</h2>
                            <button onClick={() => setShowAddModal(false)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.urlFetcher}>
                                <label>Paste URL</label>
                                <div className={styles.urlInput}>
                                    <Link size={18} />
                                    <input
                                        type="url"
                                        placeholder="https://example.com/resource"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                    />
                                    <button onClick={fetchUrlMetadata} disabled={fetchingMetadata}>
                                        {fetchingMetadata ? <Loader2 className={styles.spinner} size={16} /> : 'Fetch'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={newResource.title || ''}
                                        onChange={(e) => setNewResource(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="Resource title"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Author</label>
                                    <input
                                        type="text"
                                        value={newResource.author || ''}
                                        onChange={(e) => setNewResource(prev => ({ ...prev, author: e.target.value }))}
                                        placeholder="Author name"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Type</label>
                                    <Select
                                        options={resourceTypeOptions}
                                        value={newResource.type || 'ARTICLE'}
                                        onChange={(value) => setNewResource(prev => ({ ...prev, type: value as any }))}
                                        placeholder="Select type"
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Skill Track</label>
                                    <Select
                                        options={[
                                            { value: '', label: 'General (All Tracks)' },
                                            ...Object.entries(skillTrackLabels).map(([value, label]) => ({ value, label })),
                                        ]}
                                        value={newResource.skillTracks?.[0] || ''}
                                        onChange={(value) => setNewResource(prev => ({
                                            ...prev,
                                            skillTracks: value ? [value] : []
                                        }))}
                                        placeholder="Select skill track"
                                    />
                                </div>

                                <div className={styles.formGroup + ' ' + styles.fullWidth}>
                                    <label>Description</label>
                                    <textarea
                                        value={newResource.description || ''}
                                        onChange={(e) => setNewResource(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={styles.submitBtn}
                                onClick={createResource}
                                disabled={!newResource.title || !newResource.url}
                            >
                                Add Resource
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
