import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { EmailService } from '../email';
import { SubmitPartnerInquiryDto, PartnerInterestType } from './dto';

@Injectable()
export class PartnersService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    // Submit new partner/sponsor inquiry
    async submitInquiry(dto: SubmitPartnerInquiryDto) {
        const isSponsor = dto.interestType.startsWith('SPONSOR_');

        // Map DTO interestType to Prisma enum
        const sponsorType = this.mapToSponsorType(dto.interestType);
        const partnerType = this.mapToPartnerType(dto.interestType);

        if (isSponsor) {
            // Create sponsor inquiry
            const inquiry = await this.prisma.sponsorInquiry.create({
                data: {
                    name: dto.name,
                    email: dto.email,
                    phone: dto.phone,
                    organizationType: dto.organizationType,
                    interestType: sponsorType!,
                    amountInterest: dto.amountInterest,
                    message: dto.message,
                },
            });

            // Log for notification (email to team would go here)
            console.log(`📧 New sponsor inquiry from: ${dto.name} (${dto.email})`);

            return {
                id: inquiry.id,
                type: 'sponsor',
                message: 'Thank you for your interest in sponsoring! Our team will reach out within 24 hours.',
            };
        } else {
            // Create partner inquiry
            const inquiry = await this.prisma.partnerInquiry.create({
                data: {
                    organizationName: dto.organizationName || dto.name,
                    contactName: dto.name,
                    email: dto.email,
                    phone: dto.phone,
                    partnershipType: partnerType!,
                    description: dto.message || 'No additional details provided.',
                },
            });

            console.log(`📧 New partner inquiry from: ${dto.organizationName || dto.name} (${dto.email})`);

            return {
                id: inquiry.id,
                type: 'partner',
                message: 'Thank you for your partnership interest! Our team will be in touch soon.',
            };
        }
    }

    // Admin: Get all inquiries
    async getAllInquiries() {
        const [sponsors, partners] = await Promise.all([
            this.prisma.sponsorInquiry.findMany({ orderBy: { createdAt: 'desc' } }),
            this.prisma.partnerInquiry.findMany({ orderBy: { createdAt: 'desc' } }),
        ]);

        return {
            sponsors,
            partners,
            total: sponsors.length + partners.length,
        };
    }

    // Admin: Update inquiry status
    async updateSponsorStatus(id: string, status: string, notes?: string) {
        return this.prisma.sponsorInquiry.update({
            where: { id },
            data: {
                status: status as any,
                notes,
                followedUpAt: new Date(),
            },
        });
    }

    async updatePartnerStatus(id: string, status: string, notes?: string) {
        return this.prisma.partnerInquiry.update({
            where: { id },
            data: {
                status: status as any,
                notes,
                followedUpAt: new Date(),
            },
        });
    }

    // Helper: Map interest type to Prisma SponsorType
    private mapToSponsorType(type: PartnerInterestType) {
        const map: Record<string, string> = {
            SPONSOR_ONE_MONTH: 'ONE_MONTH',
            SPONSOR_FULL_PROGRAM: 'FULL_PROGRAM',
            SPONSOR_CUSTOM: 'CUSTOM',
            SPONSOR_CORPORATE: 'CORPORATE',
        };
        return map[type] as any;
    }

    // Helper: Map interest type to Prisma PartnerType
    private mapToPartnerType(type: PartnerInterestType) {
        const map: Record<string, string> = {
            TRAINING_PARTNER: 'TRAINING_PARTNER',
            EMPLOYMENT_PARTNER: 'EMPLOYMENT_PARTNER',
            VENUE_PARTNER: 'VENUE_PARTNER',
            CONTENT_PARTNER: 'CONTENT_PARTNER',
            MEDIA_PARTNER: 'MEDIA_PARTNER',
            CHURCH_PARTNER: 'CHURCH_PARTNER',
            SCHOOL_PARTNER: 'SCHOOL_PARTNER',
            OTHER: 'OTHER',
        };
        return map[type] as any;
    }
}
