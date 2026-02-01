import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { R2Service } from '../uploads';
import { SubmitTestimonialDto, UpdateTestimonialDto } from './dto';
import { TestimonialStatus } from '@prisma/client';

@Injectable()
export class TestimonialsService {
    private readonly logger = new Logger(TestimonialsService.name);

    constructor(
        private prisma: PrismaService,
        private r2: R2Service,
    ) { }

    // Get all approved testimonials (for public display)
    async getApproved() {
        const testimonials = await this.prisma.testimonial.findMany({
            where: { status: TestimonialStatus.APPROVED },
            orderBy: [
                { isFeatured: 'desc' },
                { displayOrder: 'asc' },
                { submittedAt: 'desc' },
            ],
            select: {
                id: true,
                name: true,
                role: true,
                company: true,
                location: true,
                quote: true,
                skills: true,
                imageKey: true,
                isFeatured: true,
            },
        });

        // Derive imageUrl from imageKey for each testimonial
        return testimonials.map(t => ({
            ...t,
            imageUrl: t.imageKey ? this.r2.getPublicUrl(t.imageKey) : null,
        }));
    }

    // Submit new testimonial (needs approval)
    async submit(dto: SubmitTestimonialDto) {
        // imageKey is provided by frontend after direct R2 upload
        const testimonial = await this.prisma.testimonial.create({
            data: {
                name: dto.name,
                role: dto.role,
                company: dto.company,
                location: dto.location,
                quote: dto.quote,
                skills: dto.skills || [],
                imageKey: dto.imageKey || null,
                status: TestimonialStatus.PENDING,
            },
        });

        this.logger.log(`New testimonial submitted: ${testimonial.id}`);

        return {
            id: testimonial.id,
            message: 'Thank you for sharing your story! It will be reviewed by our team.',
        };
    }

    // Admin: Get all testimonials (for moderation)
    async getAll() {
        const testimonials = await this.prisma.testimonial.findMany({
            orderBy: { submittedAt: 'desc' },
        });

        // Derive imageUrl from imageKey
        return testimonials.map(t => ({
            ...t,
            imageUrl: t.imageKey ? this.r2.getPublicUrl(t.imageKey) : null,
        }));
    }

    // Admin: Approve testimonial
    async approve(id: string, approvedBy: string) {
        return this.prisma.testimonial.update({
            where: { id },
            data: {
                status: TestimonialStatus.APPROVED,
                approvedBy,
                approvedAt: new Date(),
            },
        });
    }

    // Admin: Reject testimonial
    async reject(id: string) {
        return this.prisma.testimonial.update({
            where: { id },
            data: { status: TestimonialStatus.REJECTED },
        });
    }

    // Admin: Update display order / featured status
    async updateDisplay(id: string, displayOrder?: number, isFeatured?: boolean) {
        return this.prisma.testimonial.update({
            where: { id },
            data: {
                ...(displayOrder !== undefined && { displayOrder }),
                ...(isFeatured !== undefined && { isFeatured }),
            },
        });
    }

    // Admin: Edit testimonial content
    async update(id: string, dto: UpdateTestimonialDto) {
        // imageKey is provided by frontend after direct R2 upload (when replacing image)
        return this.prisma.testimonial.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.role && { role: dto.role }),
                ...(dto.company !== undefined && { company: dto.company }),
                ...(dto.location && { location: dto.location }),
                ...(dto.quote && { quote: dto.quote }),
                ...(dto.skills && { skills: dto.skills }),
                ...(dto.imageKey && { imageKey: dto.imageKey }),
            },
        });
    }
}
