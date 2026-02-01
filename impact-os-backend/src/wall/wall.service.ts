import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { MissionEngineService } from '../mission';
import { Platform, WallPostStatus } from '@prisma/client';

/**
 * Wall Service
 * 
 * Handles The Wall (public story feed):
 * 1. Auto-publish posts (no approval needed)
 * 2. Auto-ranking based on user performance
 * 3. Admin flagging/removal
 */

export interface CreateWallPostDto {
    platform: Platform;
    caption: string;
    postUrl?: string;
    usedHashtag?: boolean;
    canFeature?: boolean;
}

@Injectable()
export class WallService {
    private readonly logger = new Logger(WallService.name);

    constructor(
        private prisma: PrismaService,
        private missionEngine: MissionEngineService,
    ) { }

    // ===== PUBLIC ENDPOINTS =====

    /**
     * Get wall posts for public display
     * Returns featured (top 3) and paginated feed
     */
    async getPublicWall(limit = 20, offset = 0) {
        const [featured, posts, total] = await Promise.all([
            // Top 3 for featured section
            this.prisma.wallPost.findMany({
                where: { status: WallPostStatus.PUBLISHED },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            identityLevel: true,
                        },
                    },
                },
                orderBy: { rankScore: 'desc' },
                take: 3,
            }),
            // Paginated feed
            this.prisma.wallPost.findMany({
                where: { status: WallPostStatus.PUBLISHED },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            identityLevel: true,
                            instagramHandle: true,
                            twitterHandle: true,
                        },
                    },
                },
                orderBy: { rankScore: 'desc' },
                skip: offset,
                take: limit,
            }),
            // Total count
            this.prisma.wallPost.count({
                where: { status: WallPostStatus.PUBLISHED },
            }),
        ]);

        return { featured, posts, total };
    }

    // ===== PARTICIPANT ENDPOINTS =====

    /**
     * Create a new wall post (auto-publishes)
     */
    async createPost(userId: string, dto: CreateWallPostDto) {
        // Create post (auto-published)
        const post = await this.prisma.wallPost.create({
            data: {
                userId,
                platform: dto.platform,
                caption: dto.caption,
                postUrl: dto.postUrl,
                usedHashtag: dto.usedHashtag || false,
                canFeature: dto.canFeature !== false, // Default true
                status: WallPostStatus.PUBLISHED,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        identityLevel: true,
                    },
                },
            },
        });

        // Calculate initial rank score
        const triad = await this.missionEngine.getTriadScore(userId);
        const triadBalance = (triad.technical + triad.soft + triad.commercial) / 3;
        const hashtagBonus = dto.usedHashtag ? 10 : 0;
        const recencyBonus = 30; // Max for new posts

        const rankScore = triadBalance + hashtagBonus + recencyBonus;

        await this.prisma.wallPost.update({
            where: { id: post.id },
            data: { rankScore },
        });

        // Log behavior
        await this.missionEngine.logBehavior(userId, 'WALL_POST', {
            platform: dto.platform,
            usedHashtag: dto.usedHashtag,
        });

        this.logger.log(`Wall post created by user ${userId}`);

        return { ...post, rankScore };
    }

    /**
     * Get user's own posts
     */
    async getUserPosts(userId: string) {
        return this.prisma.wallPost.findMany({
            where: { userId },
            orderBy: { submittedAt: 'desc' },
        });
    }

    /**
     * Delete own post
     */
    async deleteOwnPost(userId: string, postId: string) {
        const post = await this.prisma.wallPost.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.userId !== userId) {
            throw new ForbiddenException('Cannot delete another user\'s post');
        }

        await this.prisma.wallPost.delete({
            where: { id: postId },
        });

        return { success: true };
    }

    // ===== ADMIN ENDPOINTS =====

    /**
     * Get all posts for admin moderation
     */
    async getAdminWall(limit = 50, offset = 0, status?: WallPostStatus) {
        const where = status ? { status } : {};

        const [posts, total] = await Promise.all([
            this.prisma.wallPost.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            identityLevel: true,
                        },
                    },
                },
                orderBy: { submittedAt: 'desc' },
                skip: offset,
                take: limit,
            }),
            this.prisma.wallPost.count({ where }),
        ]);

        return { posts, total };
    }

    /**
     * Flag/remove a post (admin only)
     */
    async removePost(postId: string, flaggedBy: string) {
        const post = await this.prisma.wallPost.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return this.prisma.wallPost.update({
            where: { id: postId },
            data: {
                status: WallPostStatus.REMOVED,
                flaggedAt: new Date(),
                flaggedBy,
            },
        });
    }

    /**
     * Restore a removed post (admin only)
     */
    async restorePost(postId: string) {
        const post = await this.prisma.wallPost.findUnique({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        return this.prisma.wallPost.update({
            where: { id: postId },
            data: {
                status: WallPostStatus.PUBLISHED,
                flaggedAt: null,
                flaggedBy: null,
            },
        });
    }

    /**
     * Get wall statistics for admin dashboard
     */
    async getWallStats() {
        const [total, published, removed, platformBreakdown] = await Promise.all([
            this.prisma.wallPost.count(),
            this.prisma.wallPost.count({ where: { status: WallPostStatus.PUBLISHED } }),
            this.prisma.wallPost.count({ where: { status: WallPostStatus.REMOVED } }),
            this.prisma.wallPost.groupBy({
                by: ['platform'],
                _count: { id: true },
            }),
        ]);

        return {
            total,
            published,
            removed,
            platformBreakdown: platformBreakdown.map(p => ({
                platform: p.platform,
                count: p._count.id,
            })),
        };
    }
}
