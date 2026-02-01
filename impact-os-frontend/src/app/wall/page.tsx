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

export default function PublicWallPage() {
    const [posts, setPosts] = useState<WallPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWall = async () => {
            try {
                const res = await fetch('/api/wall');
                if (res.ok) {
                    const data = await res.json();
                    setPosts(data);
                }
            } catch (error) {
                console.error('Failed to fetch wall:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWall();
    }, []);

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
