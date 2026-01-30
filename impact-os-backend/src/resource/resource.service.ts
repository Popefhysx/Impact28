import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto, UpdateResourceDto, ResourceQueryDto, FetchMetadataDto } from './dto';
import { ResourceStatus, ResourceType } from '@prisma/client';

@Injectable()
export class ResourceService {
    constructor(private prisma: PrismaService) { }

    // ========== PUBLIC ENDPOINTS ==========

    /**
     * Get all approved resources (public endpoint for all users)
     */
    async getApprovedResources(query: ResourceQueryDto) {
        const where: any = {
            status: ResourceStatus.APPROVED,
        };

        if (query.type) {
            where.type = query.type;
        }

        if (query.skillTrack) {
            where.skillTracks = { has: query.skillTrack };
        }

        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { author: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.resource.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }

    // ========== ADMIN ENDPOINTS ==========

    /**
     * Get all resources with optional filters (admin)
     */
    async getAllResources(query: ResourceQueryDto) {
        const where: any = {};

        if (query.status) {
            where.status = query.status as ResourceStatus;
        }

        if (query.type) {
            where.type = query.type;
        }

        if (query.skillTrack) {
            where.skillTracks = { has: query.skillTrack };
        }

        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
                { author: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.resource.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { source: true },
        });
    }

    /**
     * Create a new resource (admin)
     */
    async createResource(dto: CreateResourceDto, createdBy?: string) {
        // Check for duplicate URL
        const existing = await this.prisma.resource.findUnique({
            where: { url: dto.url },
        });

        if (existing) {
            throw new ConflictException('Resource with this URL already exists');
        }

        return this.prisma.resource.create({
            data: {
                ...dto,
                skillTracks: dto.skillTracks || [],
                tags: dto.tags || [],
                createdBy,
            },
        });
    }

    /**
     * Fetch metadata from URL (Open Graph, YouTube, etc.)
     */
    async fetchMetadata(dto: FetchMetadataDto): Promise<Partial<CreateResourceDto>> {
        const { url } = dto;

        try {
            // YouTube video detection
            const youtubeMatch = url.match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
            );

            if (youtubeMatch) {
                return this.fetchYouTubeMetadata(youtubeMatch[1]);
            }

            // Generic Open Graph fetch
            return this.fetchOpenGraphMetadata(url);
        } catch (error) {
            console.error('Metadata fetch error:', error);
            return { url, title: '', description: '', type: ResourceType.ARTICLE };
        }
    }

    /**
     * Fetch YouTube video metadata
     */
    private async fetchYouTubeMetadata(videoId: string): Promise<Partial<CreateResourceDto>> {
        // Note: In production, use YouTube Data API with API key
        // For now, we'll use oEmbed which doesn't require API key
        try {
            const response = await fetch(
                `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch YouTube metadata');
            }

            const data = await response.json();

            return {
                url: `https://www.youtube.com/watch?v=${videoId}`,
                title: data.title || '',
                author: data.author_name || '',
                thumbnail: data.thumbnail_url || '',
                type: ResourceType.VIDEO,
            };
        } catch (error) {
            return {
                url: `https://www.youtube.com/watch?v=${videoId}`,
                type: ResourceType.VIDEO,
            };
        }
    }

    /**
     * Fetch Open Graph metadata from any URL
     */
    private async fetchOpenGraphMetadata(url: string): Promise<Partial<CreateResourceDto>> {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; ImpactOS/1.0)',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch page');
            }

            const html = await response.text();

            // Parse Open Graph tags
            const getMetaContent = (property: string): string | undefined => {
                const regex = new RegExp(
                    `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
                    'i'
                );
                const match = html.match(regex);
                return match?.[1];
            };

            const title = getMetaContent('og:title') ||
                getMetaContent('twitter:title') ||
                html.match(/<title>([^<]*)<\/title>/i)?.[1] || '';

            const description = getMetaContent('og:description') ||
                getMetaContent('twitter:description') ||
                getMetaContent('description') || '';

            const thumbnail = getMetaContent('og:image') ||
                getMetaContent('twitter:image') || '';

            // Try to detect type from URL or content
            let type: ResourceType = ResourceType.ARTICLE;
            if (url.includes('podcast') || url.includes('spotify.com/show')) {
                type = ResourceType.PODCAST;
            } else if (url.includes('amazon.com') || url.includes('goodreads.com')) {
                type = ResourceType.BOOK;
            }

            return {
                url,
                title: this.decodeHtmlEntities(title),
                description: this.decodeHtmlEntities(description),
                thumbnail,
                type,
            };
        } catch (error) {
            return { url, type: ResourceType.ARTICLE };
        }
    }

    private decodeHtmlEntities(text: string): string {
        return text
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&#x27;/g, "'");
    }

    /**
     * Approve a pending resource (admin)
     */
    async approveResource(id: string, approvedBy: string) {
        const resource = await this.prisma.resource.findUnique({ where: { id } });

        if (!resource) {
            throw new NotFoundException('Resource not found');
        }

        return this.prisma.resource.update({
            where: { id },
            data: {
                status: ResourceStatus.APPROVED,
                approvedAt: new Date(),
                approvedBy,
            },
        });
    }

    /**
     * Reject a pending resource (admin)
     */
    async rejectResource(id: string) {
        const resource = await this.prisma.resource.findUnique({ where: { id } });

        if (!resource) {
            throw new NotFoundException('Resource not found');
        }

        return this.prisma.resource.update({
            where: { id },
            data: {
                status: ResourceStatus.REJECTED,
            },
        });
    }

    /**
     * Update a resource (admin)
     */
    async updateResource(id: string, dto: UpdateResourceDto) {
        const resource = await this.prisma.resource.findUnique({ where: { id } });

        if (!resource) {
            throw new NotFoundException('Resource not found');
        }

        return this.prisma.resource.update({
            where: { id },
            data: dto,
        });
    }

    /**
     * Delete a resource (admin)
     */
    async deleteResource(id: string) {
        const resource = await this.prisma.resource.findUnique({ where: { id } });

        if (!resource) {
            throw new NotFoundException('Resource not found');
        }

        return this.prisma.resource.delete({ where: { id } });
    }

    /**
     * Get resource counts by status
     */
    async getResourceStats() {
        const [total, pending, approved, rejected] = await Promise.all([
            this.prisma.resource.count(),
            this.prisma.resource.count({ where: { status: ResourceStatus.PENDING } }),
            this.prisma.resource.count({ where: { status: ResourceStatus.APPROVED } }),
            this.prisma.resource.count({ where: { status: ResourceStatus.REJECTED } }),
        ]);

        const byType = await this.prisma.resource.groupBy({
            by: ['type'],
            _count: true,
            where: { status: ResourceStatus.APPROVED },
        });

        return {
            total,
            pending,
            approved,
            rejected,
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count;
                return acc;
            }, {} as Record<string, number>),
        };
    }
}
