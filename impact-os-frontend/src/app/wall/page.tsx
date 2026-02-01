'use client';

import { useState, useEffect } from 'react';
import {
    Globe, ExternalLink, Loader2, Star, Trophy,
    Linkedin, Twitter, Instagram, Youtube, Hash
} from 'lucide-react';
import styles from './page.module.css';

// Platform Icons
const PlatformIcon = ({ platform }: { platform: string }) => {
    switch (platform) {
        case 'LINKEDIN': return <Linkedin size={14} />;
        case 'TWITTER': return <Twitter size={14} />;
        case 'INSTAGRAM': return <Instagram size={14} />;
        case 'YOUTUBE': return <Youtube size={14} />;
        default: return <Globe size={14} />;
    }
};

const PlatformClass = ({ platform }: { platform: string }) => {
    switch (platform) {
        case 'LINKEDIN': return styles.platformLink;
        case 'TWITTER': return styles.platformTwitter;
        case 'INSTAGRAM': return styles.platformInstagram;
        case 'YOUTUBE': return styles.platformYoutube;
        default: return styles.platformLink;
    }
};

interface WallPost {
    id: string;
    caption: string;
    platform: string;
    postUrl?: string;
    usedHashtag: boolean;
    submittedAt: string;
    user: {
        firstName: string;
        lastName: string;
        identityLevel: string;
    };
    rankScore: number;
}

// Mock data for development
const mockPosts: WallPost[] = [
    {
        id: 'wall-001',
        caption: 'Just landed my first freelance gig! Built a full e-commerce website for a local boutique. The skills from Impact OS made all the difference.',
        platform: 'LINKEDIN',
        postUrl: 'https://linkedin.com/posts/example1',
        usedHashtag: true,
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        user: { firstName: 'Adaeze', lastName: 'Okonkwo', identityLevel: 'L4_EARNER' },
        rankScore: 95,
    },
    {
        id: 'wall-002',
        caption: 'From zero coding experience to building mobile apps in 3 months. Never thought I could do this! Big thanks to my mentors.',
        platform: 'TWITTER',
        postUrl: 'https://twitter.com/example2',
        usedHashtag: true,
        submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        user: { firstName: 'Chidi', lastName: 'Eze', identityLevel: 'L3_EXPOSED' },
        rankScore: 88,
    },
    {
        id: 'wall-003',
        caption: 'Completed my 30-day streak! Consistency is everything. Every small step counts towards the bigger picture.',
        platform: 'INSTAGRAM',
        postUrl: 'https://instagram.com/p/example3',
        usedHashtag: true,
        submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        user: { firstName: 'Ngozi', lastName: 'Ibe', identityLevel: 'L2_SKILLED' },
        rankScore: 82,
    },
    {
        id: 'wall-004',
        caption: 'Just published my first YouTube tutorial on graphic design basics! Sharing what I learned with others.',
        platform: 'YOUTUBE',
        postUrl: 'https://youtube.com/watch?v=example4',
        usedHashtag: false,
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        user: { firstName: 'Emeka', lastName: 'Nnamdi', identityLevel: 'L3_EXPOSED' },
        rankScore: 75,
    },
    {
        id: 'wall-005',
        caption: 'Client just paid for my first logo design! ₦25,000 from skills I learned in 6 weeks. The journey continues!',
        platform: 'LINKEDIN',
        postUrl: 'https://linkedin.com/posts/example5',
        usedHashtag: true,
        submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        user: { firstName: 'Amara', lastName: 'Okoro', identityLevel: 'L4_EARNER' },
        rankScore: 70,
    },
    {
        id: 'wall-006',
        caption: 'Day 7 of my coding journey. Built my first portfolio website today. It is not perfect but it is mine!',
        platform: 'TWITTER',
        usedHashtag: true,
        submittedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        user: { firstName: 'Tunde', lastName: 'Adeyemi', identityLevel: 'L1_ACTIVATED' },
        rankScore: 60,
    },
];

export default function PublicWallPage() {
    const [posts, setPosts] = useState<WallPost[]>([]);
    const [loading, setLoading] = useState(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

    useEffect(() => {
        const fetchWall = async () => {
            try {
                const res = await fetch(`${API_BASE}/wall`);
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data.length > 0 ? data : (process.env.NODE_ENV !== 'production' ? mockPosts : []));
                } else if (process.env.NODE_ENV !== 'production') {
                    setPosts(mockPosts);
                } else {
                    setPosts([]);
                }
            } catch (error) {
                console.error('Failed to fetch wall:', error);
                if (process.env.NODE_ENV !== 'production') {
                    setPosts(mockPosts);
                } else {
                    setPosts([]);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchWall();
    }, [API_BASE]);

    if (loading) {
        return (
            <div className={styles.loading}>
                <Loader2 size={32} className={styles.spinner} />
                <p>Loading The Wall...</p>
            </div>
        );
    }

    // Top 3 Featured Posts
    const featuredPosts = posts.slice(0, 3);
    const regularPosts = posts.slice(3);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>The Wall</h1>
                <p className={styles.subtitle}>
                    Real stories of impact, auto-ranked by behavior.
                </p>
            </header>

            {/* Featured Section */}
            {featuredPosts.length > 0 && (
                <section className={styles.featuredSection}>
                    <h2 className={styles.sectionTitle}>
                        <Star size={20} fill="var(--gold-warm)" color="var(--gold-warm)" />
                        Featured Impact
                    </h2>
                    <div className={styles.featuredGrid}>
                        {featuredPosts.map(post => (
                            <WallPostCard key={post.id} post={post} />
                        ))}
                    </div>
                </section>
            )}

            {/* Live Feed */}
            <section className={styles.feedSection}>
                <h2 className={styles.sectionTitle}>
                    <Globe size={20} />
                    Live Feed
                </h2>

                {posts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No posts yet. Be the first to share your story!</p>
                    </div>
                ) : (
                    <div className={styles.feed}>
                        {regularPosts.map(post => (
                            <WallPostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function WallPostCard({ post }: { post: WallPost }) {
    return (
        <article className={styles.postCard}>
            <div className={styles.postHeader}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        {post.user.firstName[0]}{post.user.lastName[0]}
                    </div>
                    <div>
                        <span className={styles.userName}>
                            {post.user.firstName} {post.user.lastName}
                        </span>
                        <span className={styles.userLevel}>
                            {post.user.identityLevel.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
                <span className={styles.postDate}>
                    {new Date(post.submittedAt).toLocaleDateString()}
                </span>
            </div>

            <div className={styles.postContent}>
                <div className={`${styles.platformBadge} ${PlatformClass({ platform: post.platform })}`}>
                    <PlatformIcon platform={post.platform} />
                    {post.platform}
                </div>

                <p className={styles.caption}>
                    {post.caption}
                    {post.usedHashtag && (
                        <span className={styles.hashtag}> #ImpactOS</span>
                    )}
                </p>
            </div>

            {post.postUrl && (
                <div className={styles.postFooter}>
                    <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewLink}
                    >
                        View Original <ExternalLink size={14} />
                    </a>
                </div>
            )}
        </article>
    );
}
