import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { SubmitTestimonialDto } from './dto';
import { TestimonialStatus } from '@prisma/client';

@Injectable()
export class TestimonialsService {
    constructor(private prisma: PrismaService) { }

    // Get all approved testimonials (for public display)
    async getApproved() {
        return this.prisma.testimonial.findMany({
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
                imageUrl: true,
                isFeatured: true,
            },
        });
    }

    // Submit new testimonial (needs approval)
    async submit(dto: SubmitTestimonialDto) {
        const testimonial = await this.prisma.testimonial.create({
            data: {
                ...dto,
                skills: dto.skills || [],
                status: TestimonialStatus.PENDING,
            },
        });

        return {
            id: testimonial.id,
            message: 'Thank you for sharing your story! It will be reviewed by our team.',
        };
    }

    // Admin: Get all testimonials (for moderation)
    async getAll() {
        return this.prisma.testimonial.findMany({
            orderBy: { submittedAt: 'desc' },
        });
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
}
