import { Controller, Post, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { MissionService } from './mission.service';
import { SkillDomain, Difficulty, IdentityLevel, MissionStatus } from '@prisma/client';

// DTOs
class CreateMissionDto {
    title: string;
    description: string;
    skillDomain: SkillDomain;
    difficulty: Difficulty;
    momentum?: number;
    skillXp?: number;
    arenaPoints?: number;
    requiredLevel?: IdentityLevel;
    isDaily?: boolean;
    isWeekly?: boolean;
}

class CompleteMissionDto {
    proofUrl?: string;
    proofText?: string;
}

@Controller('missions')
export class MissionController {
    constructor(private missionService: MissionService) { }

    // ===== USER ENDPOINTS =====

    @Get(':userId/available')
    async getAvailableMissions(@Param('userId') userId: string) {
        return this.missionService.getAvailableMissions(userId);
    }

    @Get(':userId')
    async getUserMissions(
        @Param('userId') userId: string,
        @Query('status') status?: MissionStatus,
    ) {
        return this.missionService.getUserMissions(userId, status);
    }

    @Get(':userId/active')
    async getActiveMissions(@Param('userId') userId: string) {
        return this.missionService.getActiveMissions(userId);
    }

    @Get(':userId/stats')
    async getUserMissionStats(@Param('userId') userId: string) {
        return this.missionService.getUserMissionStats(userId);
    }

    @Post(':userId/assign/:missionId')
    async assignMission(
        @Param('userId') userId: string,
        @Param('missionId') missionId: string,
        @Body('deadlineDays') deadlineDays?: number,
    ) {
        return this.missionService.assignMission(userId, missionId, deadlineDays);
    }

    @Post(':userId/start/:assignmentId')
    async startMission(
        @Param('userId') userId: string,
        @Param('assignmentId') assignmentId: string,
    ) {
        return this.missionService.startMission(userId, assignmentId);
    }

    @Post(':userId/submit/:assignmentId')
    async submitMission(
        @Param('userId') userId: string,
        @Param('assignmentId') assignmentId: string,
        @Body() dto: CompleteMissionDto,
    ) {
        return this.missionService.submitMission(userId, assignmentId, dto);
    }

    // ===== ADMIN ENDPOINTS =====

    @Post('admin/create')
    async createMission(@Body() dto: CreateMissionDto) {
        return this.missionService.createMission(dto);
    }

    @Get('admin/pending')
    async getPendingReviews() {
        return this.missionService.getPendingReviews();
    }

    @Post('admin/:assignmentId/approve')
    async approveMission(@Param('assignmentId') assignmentId: string) {
        return this.missionService.approveMission(assignmentId);
    }

    @Post('admin/:assignmentId/fail')
    async failMission(
        @Param('assignmentId') assignmentId: string,
        @Body('reason') reason: string,
    ) {
        return this.missionService.failMission(assignmentId, reason);
    }

    // Cron trigger endpoint
    @Post('admin/assign-daily')
    async assignDailyMissions() {
        const count = await this.missionService.assignDailyMissions();
        return { assigned: count };
    }

    // New endpoints for mission management

    @Get('all')
    async getAllMissions(
        @Query('isActive') isActive?: string,
        @Query('skillDomain') skillDomain?: SkillDomain,
        @Query('difficulty') difficulty?: Difficulty,
    ) {
        const filters: any = {};
        if (isActive !== undefined) {
            filters.isActive = isActive === 'true';
        }
        if (skillDomain) {
            filters.skillDomain = skillDomain;
        }
        if (difficulty) {
            filters.difficulty = difficulty;
        }
        return this.missionService.getAllMissions(filters);
    }

    @Get('admin/stats')
    async getMissionStats() {
        return this.missionService.getMissionStats();
    }

    @Patch('admin/:missionId')
    async updateMission(
        @Param('missionId') missionId: string,
        @Body() dto: Partial<CreateMissionDto>,
    ) {
        return this.missionService.updateMission(missionId, dto);
    }

    @Patch('admin/:missionId/status')
    async updateMissionStatus(
        @Param('missionId') missionId: string,
        @Body('isActive') isActive: boolean,
    ) {
        return this.missionService.updateMissionStatus(missionId, isActive);
    }
}
