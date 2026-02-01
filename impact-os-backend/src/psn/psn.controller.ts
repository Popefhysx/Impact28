import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PsnService } from './psn.service';

/**
 * PSN Controller
 * 
 * Admin-only endpoints for PSN operations.
 * All PSN data is internal - never exposed to participants.
 */
@Controller('admin/psn')
export class PsnController {
    constructor(private psnService: PsnService) { }

    /**
     * Calculate PSN for a single applicant
     */
    @Post('calculate/:applicantId')
    async calculatePsn(@Param('applicantId') applicantId: string) {
        const result = await this.psnService.calculatePsn(applicantId);
        return {
            success: true,
            data: result,
            _notice: 'PSN is a forecast estimate only. Support is still request-based and behavior-gated.',
        };
    }

    /**
     * Generate cohort-level PSN forecast
     */
    @Post('cohorts/:cohortId/generate')
    async generateCohortForecast(@Param('cohortId') cohortId: string) {
        const forecast = await this.psnService.generateCohortForecast(cohortId);
        return {
            success: true,
            data: forecast,
            _notice: 'PSN is a forecast estimate only. Support is still request-based and behavior-gated.',
        };
    }

    /**
     * Get cohort PSN forecast
     */
    @Get('cohorts/:cohortId/forecast')
    async getCohortForecast(@Param('cohortId') cohortId: string) {
        const forecast = await this.psnService.getCohortForecast(cohortId);
        return {
            success: true,
            data: forecast,
            _notice: 'PSN is a forecast estimate only. Support is still request-based and behavior-gated.',
        };
    }

    /**
     * Get active detection triggers (for operator queue)
     */
    @Get('detection/triggers')
    async getActiveDetectionTriggers() {
        const triggers = await this.psnService.getActiveDetectionTriggers();
        return {
            success: true,
            data: triggers,
            count: triggers.length,
        };
    }

    /**
     * Get detection triggers for a specific participant
     */
    @Get('detection/triggers/:participantId')
    async getParticipantTriggers(@Param('participantId') participantId: string) {
        const triggers = await this.psnService.getActiveDetectionTriggers(participantId);
        return {
            success: true,
            data: triggers,
        };
    }

    /**
     * Resolve a detection trigger
     */
    @Post('detection/triggers/:triggerId/resolve')
    async resolveDetectionTrigger(@Param('triggerId') triggerId: string) {
        const trigger = await this.psnService.resolveDetectionTrigger(triggerId);
        return {
            success: true,
            data: trigger,
        };
    }

    /**
     * Run behavioral trigger detection for all active participants
     * Typically called by a cron job
     */
    @Post('detection/run')
    async runBehavioralTriggerDetection() {
        const result = await this.psnService.runBehavioralTriggerDetection();
        return {
            success: true,
            data: result,
            message: `Detected ${result.triggersCreated} triggers across ${result.participantsChecked} participants`,
        };
    }

    /**
     * Create a mentor signal for a participant (manual trigger)
     */
    @Post('detection/mentor-signal/:participantId')
    async createMentorSignal(
        @Param('participantId') participantId: string,
        @Body('operatorId') operatorId: string,
        @Body('notes') notes?: string,
    ) {
        const trigger = await this.psnService.createMentorSignal(
            participantId,
            operatorId,
            notes,
        );
        return {
            success: true,
            data: trigger,
        };
    }
}
