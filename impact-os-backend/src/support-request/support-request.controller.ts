import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SupportRequestService } from './support-request.service';
import { CreateSupportRequestDto } from './dto';

/**
 * Support Request Controller
 * 
 * Participant-facing endpoints for support requests.
 * 
 * Key principles:
 * - No amounts shown
 * - Neutral messaging
 * - Mission-linked where possible
 */
@Controller('support')
export class SupportRequestController {
    constructor(private supportRequestService: SupportRequestService) { }

    /**
     * Check if current user is eligible to request support
     * Shows available support types and any blockers
     */
    @Get('eligibility/:userId')
    async checkEligibility(@Param('userId') userId: string) {
        const eligibility = await this.supportRequestService.checkEligibility(userId);
        return {
            success: true,
            data: eligibility,
        };
    }

    /**
     * Get active missions for the request form dropdown
     */
    @Get('missions/:userId')
    async getActiveMissions(@Param('userId') userId: string) {
        const missions = await this.supportRequestService.getActiveMissions(userId);
        return {
            success: true,
            data: missions,
        };
    }

    /**
     * Submit a new support request
     */
    @Post('request/:userId')
    async createRequest(
        @Param('userId') userId: string,
        @Body() dto: CreateSupportRequestDto,
    ) {
        const request = await this.supportRequestService.createRequest(userId, dto);
        return {
            success: true,
            data: request,
            message: 'Your request has been submitted',
        };
    }

    /**
     * Get request history for a user
     * Note: No amounts are ever shown
     */
    @Get('requests/:userId')
    async getRequestHistory(@Param('userId') userId: string) {
        const requests = await this.supportRequestService.getRequestHistory(userId);
        return {
            success: true,
            data: requests,
        };
    }

    /**
     * Get status of a specific request
     */
    @Get('requests/:userId/:requestId')
    async getRequestStatus(
        @Param('userId') userId: string,
        @Param('requestId') requestId: string,
    ) {
        const request = await this.supportRequestService.getRequestStatus(userId, requestId);
        return {
            success: true,
            data: request,
        };
    }
}
