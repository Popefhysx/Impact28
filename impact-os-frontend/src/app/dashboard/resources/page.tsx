'use client';

import { useState, useEffect } from 'react';
import { Book, ExternalLink, Video, FileText, Podcast, LayoutGrid, List, Search, Loader2 } from 'lucide-react';
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

// Curated resources for when API is unavailable
const sampleResources: Resource[] = [
    // Business & Mindset Books
    {
        id: '1',
        title: 'The Psychology of Money',
        author: 'Morgan Housel',
        description: 'Timeless lessons on wealth, greed, and happiness. How behavior matters more than knowledge.',
        url: 'https://www.amazon.com/Psychology-Money-Timeless-lessons-happiness/dp/0857197681',
        type: 'BOOK',
        skillTracks: [],
        tags: ['finance', 'mindset', 'behavior'],
    },
    {
        id: '2',
        title: 'Steal Like an Artist',
        author: 'Austin Kleon',
        description: '10 things nobody told you about being creative. Embrace influence to find your voice.',
        url: 'https://austinkleon.com/steal/',
        type: 'BOOK',
        skillTracks: ['GRAPHICS_DESIGN'],
        tags: ['creativity', 'art', 'inspiration'],
    },
    {
        id: '3',
        title: 'The Personal MBA',
        author: 'Josh Kaufman',
        description: 'Master the art of business. Everything you need to know, without the debt.',
        url: 'https://personalmba.com/',
        type: 'BOOK',
        skillTracks: [],
        tags: ['business', 'entrepreneurship', 'strategy'],
    },
    {
        id: '4',
        title: '100 Great Business Ideas',
        author: 'Jeremy Kourdi',
        description: 'From proven companies and leaders. Real ideas that changed the business world.',
        url: 'https://www.amazon.com/100-Great-Business-Ideas-Companies/dp/0462099423',
        type: 'BOOK',
        skillTracks: [],
        tags: ['business', 'ideas', 'innovation'],
    },
    {
        id: '5',
        title: '100 Great PR Ideas',
        author: 'Jim Blythe',
        description: 'Simple yet effective PR strategies from leading companies.',
        url: 'https://www.amazon.com/100-Great-Ideas-Jim-Blythe/dp/0462099415',
        type: 'BOOK',
        skillTracks: ['DIGITAL_MARKETING'],
        tags: ['marketing', 'pr', 'communications'],
    },
    {
        id: '6',
        title: 'Quantum Marketing',
        author: 'Raja Rajamannar',
        description: 'Mastering the new marketing mindset for tomorrow\'s consumers.',
        url: 'https://www.amazon.com/Quantum-Marketing-Mastering-Mindset-Tomorrows/dp/140023590X',
        type: 'BOOK',
        skillTracks: ['DIGITAL_MARKETING'],
        tags: ['marketing', 'digital', 'future'],
    },
    // Seth Godin Resources
    {
        id: '7',
        title: 'Seth\'s Blog',
        author: 'Seth Godin',
        description: 'Daily insights on marketing, leadership, and making change happen.',
        url: 'https://seths.blog/',
        type: 'BLOG',
        skillTracks: ['DIGITAL_MARKETING'],
        tags: ['marketing', 'leadership', 'ideas'],
    },
    {
        id: '8',
        title: 'Purple Cow',
        author: 'Seth Godin',
        description: 'Transform your business by being remarkable. Stand out or blend in.',
        url: 'https://www.amazon.com/Purple-Cow-Transform-Business-Remarkable/dp/014101640X',
        type: 'BOOK',
        skillTracks: ['DIGITAL_MARKETING'],
        tags: ['marketing', 'branding', 'innovation'],
    },
    // Visual Design Resources
    {
        id: '9',
        title: 'Refactoring UI',
        author: 'Adam Wathan & Steve Schoger',
        description: 'Learn design from a developer\'s perspective. Practical UI improvement techniques.',
        url: 'https://www.refactoringui.com/',
        type: 'BOOK',
        skillTracks: ['GRAPHICS_DESIGN', 'WEB_DESIGN'],
        tags: ['design', 'ui', 'practical'],
    },
    {
        id: '10',
        title: 'Design Principles of Successful Interfaces',
        author: 'The Futur',
        description: 'Core principles that make interfaces intuitive and beautiful.',
        url: 'https://www.youtube.com/watch?v=yNDgFK2Jj1E',
        type: 'VIDEO',
        skillTracks: ['GRAPHICS_DESIGN', 'WEB_DESIGN'],
        tags: ['design', 'ui', 'principles'],
    },
    {
        id: '11',
        title: 'Typography Fundamentals',
        author: 'Envato Tuts+',
        description: 'Master the art of choosing and pairing fonts for any project.',
        url: 'https://www.youtube.com/watch?v=sByzHoiYFX0',
        type: 'VIDEO',
        skillTracks: ['GRAPHICS_DESIGN'],
        tags: ['typography', 'design', 'fundamentals'],
    },
    {
        id: '12',
        title: 'Color Theory for Designers',
        description: 'Understanding color psychology and creating harmonious palettes.',
        url: 'https://www.smashingmagazine.com/2010/01/color-theory-for-designers-part-1-the-meaning-of-color/',
        type: 'ARTICLE',
        skillTracks: ['GRAPHICS_DESIGN'],
        tags: ['color', 'design', 'theory'],
    },
    // Business & Freelancing
    {
        id: '13',
        title: 'The Lean Startup',
        author: 'Eric Ries',
        description: 'Build, measure, learn. The blueprint for turning ideas into products.',
        url: 'https://www.amazon.com/Lean-Startup-Entrepreneurs-Continuous-Innovation/dp/0307887898',
        type: 'BOOK',
        skillTracks: [],
        tags: ['business', 'strategy', 'startups'],
    },
    {
        id: '14',
        title: 'Atomic Habits',
        author: 'James Clear',
        description: 'Tiny changes, remarkable results. Build systems that stick.',
        url: 'https://jamesclear.com/atomic-habits',
        type: 'BOOK',
        skillTracks: [],
        tags: ['productivity', 'mindset', 'habits'],
    },
];

export default function ResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [filterType, setFilterType] = useState('ALL');
    const [filterSkillTrack, setFilterSkillTrack] = useState('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const response = await fetch(`${API_URL}/resources`);
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

    const filteredResources = resources.filter(r => {
        const matchesType = filterType === 'ALL' || r.type === filterType;
        const matchesSkillTrack = filterSkillTrack === 'ALL' ||
            r.skillTracks?.length === 0 || // General resources match all tracks
            r.skillTracks?.includes(filterSkillTrack);
        const matchesSearch = search === '' ||
            r.title?.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase()) ||
            r.author?.toLowerCase().includes(search.toLowerCase()) ||
            r.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
        return matchesType && matchesSkillTrack && matchesSearch;
    });

    // Filter options
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
                    <h1>Resources</h1>
                    <p>Curated books, articles, and videos to boost your skills</p>
                </div>
            </header>

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
            </div>

            {/* Resources */}
            {viewMode === 'list' ? (
                <div className={styles.table}>
                    <div className={styles.tableHeader}>
                        <span>Title</span>
                        <span>Type</span>
                        <span>Tags</span>
                    </div>
                    {filteredResources.map(resource => {
                        const Icon = typeIcons[resource.type] || FileText;
                        return (
                            <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.tableRow}
                            >
                                <div className={styles.titleCell}>
                                    <Icon size={18} className={styles.typeIcon} />
                                    <div>
                                        <span className={styles.titleText}>{resource.title || 'Untitled'}</span>
                                        {resource.author && <span className={styles.author}>by {resource.author}</span>}
                                    </div>
                                </div>
                                <span className={styles.typeBadge}>{typeLabels[resource.type] || resource.type}</span>
                                <div className={styles.tags}>
                                    {resource.tags?.map((tag, i) => (
                                        <span key={i} className={styles.tag}>{tag}</span>
                                    ))}
                                </div>
                            </a>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.grid}>
                    {filteredResources.map(resource => {
                        const Icon = typeIcons[resource.type] || FileText;
                        return (
                            <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.gridCard}
                            >
                                <div className={styles.cardHeader}>
                                    <span className={styles.cardBadge}>
                                        <Icon size={14} />
                                        {typeLabels[resource.type] || resource.type}
                                    </span>
                                    <ExternalLink size={14} className={styles.externalIcon} />
                                </div>
                                <h3>{resource.title || 'Untitled'}</h3>
                                {resource.author && <p className={styles.cardAuthor}>by {resource.author}</p>}
                                <p className={styles.cardDesc}>{resource.description || 'No description'}</p>
                                <div className={styles.cardFooter}>
                                    <div className={styles.tags}>
                                        {resource.tags?.slice(0, 3).map((tag, i) => (
                                            <span key={i} className={styles.tag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}

            {filteredResources.length === 0 && (
                <div className={styles.empty}>
                    <p>No resources found matching your filters.</p>
                </div>
            )}
        </div>
    );
}
