import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CalendarEngineService } from './calendar-engine.service';
import { GateEnforcementService } from './gate-enforcement.service';
import { StateAuthorityService } from './state-authority.service';
import { PauseEscalationService } from './pause-escalation.service';
import { GraduationAuthorityService } from './graduation-authority.service';
import { GateType, ParticipantState } from '@prisma/client';

/**
 * Command Centre Controller
 *
 * Admin-only endpoints for Command Centre operations.
 * Provides dashboards, gate management, and override capabilities.
 */
@Controller('admin/command-centre')
export class CommandCentreController {
    constructor(
        private calendarEngine: CalendarEngineService,
        private gateEnforcement: GateEnforcementService,
        private stateAuthority: StateAuthorityService,
        private pauseEscalation: PauseEscalationService,
        private graduationAuthority: GraduationAuthorityService,
    ) { }

    // ============================================================================
    // EXECUTIVE DASHBOARD (Read-Only Metrics)
    // ============================================================================

    @Get('dashboard/executive')
    async getExecutiveDashboard(@Query('cohortId') cohortId?: string) {
        const stats = cohortId
            ? await this.graduationAuthority.getCohortGraduationStats(cohortId)
            : null;

        return {
            participantStats: stats,
            // Add more metrics as needed
        };
    }

    // ============================================================================
    // OPERATIONS DASHBOARD
    // ============================================================================

    @Get('dashboard/operations')
    async getOperationsDashboard(@Query('cohortId') cohortId?: string) {
        const [upcomingGates, pausedParticipants, atRiskParticipants, pendingGraduations] =
            await Promise.all([
                cohortId ? this.calendarEngine.getUpcomingGates(cohortId, 7) : [],
                this.pauseEscalation.getPausedParticipants(cohortId),
                this.stateAuthority.getParticipantsByState(ParticipantState.AT_RISK, cohortId),
                this.graduationAuthority.getPendingGraduationDecisions(cohortId),
            ]);

        return {
            upcomingGates,
            pausedParticipants,
            atRiskParticipants,
            pendingGraduations,
        };
    }

    // ============================================================================
    // CALENDAR ENGINE
    // ============================================================================

    @Get('cohort/:cohortId/calendar')
    async getCohortCalendar(@Param('cohortId') cohortId: string) {
        const gates = await this.calendarEngine.getUpcomingGates(cohortId, 90);
        return { gates };
    }

    @Post('cohort/:cohortId/update-day')
    async updateCohortDay(@Param('cohortId') cohortId: string) {
        await this.calendarEngine.updateCohortDayAndPhase(cohortId);
        return { success: true };
    }

    // ============================================================================
    // GATE ENFORCEMENT
    // ============================================================================

    @Get('cohort/:cohortId/gates')
    async getCohortGates(
        @Param('cohortId') cohortId: string,
        @Query('gateType') gateType?: GateType,
    ) {
        return this.gateEnforcement.getCohortGateResults(cohortId, gateType);
    }

    @Post('gates/execute')
    async executeGates() {
        // Manual trigger for testing (normally run by cron)
        return this.gateEnforcement.executeDueGates();
    }

    // ============================================================================
    // PARTICIPANT STATE
    // ============================================================================

    @Get('participant/:userId/state')
    async getParticipantState(@Param('userId') userId: string) {
        const state = await this.stateAuthority.getParticipantState(userId);
        const history = await this.stateAuthority.getStateHistory(userId);
        return { currentState: state, history };
    }

    @Get('participants/by-state/:state')
    async getParticipantsByState(
        @Param('state') state: ParticipantState,
        @Query('cohortId') cohortId?: string,
    ) {
        return this.stateAuthority.getParticipantsByState(state, cohortId);
    }

    // ============================================================================
    // PAUSE & REACTIVATION
    // ============================================================================

    @Get('participants/paused')
    async getPausedParticipants(@Query('cohortId') cohortId?: string) {
        return this.pauseEscalation.getPausedParticipants(cohortId);
    }

    @Post('participant/:userId/reactivate')
    async reactivateParticipant(
        @Param('userId') userId: string,
        @Body() body: { reason: string; reactivatedBy: string },
    ) {
        return this.pauseEscalation.reactivateParticipant(
            userId,
            body.reactivatedBy,
            body.reason,
        );
    }

    @Post('pause-check')
    async runPauseCheck() {
        // Manual trigger for testing
        return this.pauseEscalation.runAutoPauseCheck();
    }

    // ============================================================================
    // GRADUATION & EXIT
    // ============================================================================

    @Get('cohort/:cohortId/graduation-stats')
    async getGraduationStats(@Param('cohortId') cohortId: string) {
        return this.graduationAuthority.getCohortGraduationStats(cohortId);
    }

    @Get('participant/:userId/graduation-eligibility')
    async checkGraduationEligibility(@Param('userId') userId: string) {
        return this.graduationAuthority.checkGraduationEligibility(userId);
    }

    @Get('pending-graduations')
    async getPendingGraduations(@Query('cohortId') cohortId?: string) {
        return this.graduationAuthority.getPendingGraduationDecisions(cohortId);
    }

    @Post('participant/:userId/graduate')
    async graduateParticipant(
        @Param('userId') userId: string,
        @Body() body: { graduatedBy: string },
    ) {
        return this.graduationAuthority.graduateParticipant(userId, body.graduatedBy);
    }

    @Post('participant/:userId/exit')
    async exitParticipant(
        @Param('userId') userId: string,
        @Body() body: { reason: string; exitedBy: string },
    ) {
        return this.graduationAuthority.exitParticipant(
            userId,
            body.reason,
            body.exitedBy,
        );
    }
}
