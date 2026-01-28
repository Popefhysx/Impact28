import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApplicantStatus, IdentityLevel } from '@prisma/client';

@Controller('admin')
export class AdminController {
    constructor(private adminService: AdminService) { }

    // ===== DASHBOARD =====

    @Get('dashboard')
    async getDashboardStats() {
        return this.adminService.getDashboardStats();
    }

    @Get('activity')
    async getRecentActivity(@Query('limit') limit?: number) {
        return this.adminService.getRecentActivity(limit || 20);
    }

    // ===== APPLICANTS =====

    @Get('applicants')
    async getApplicants(
        @Query('status') status?: ApplicantStatus,
        @Query('search') search?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        return this.adminService.getApplicants({ status, search, limit, offset });
    }

    @Get('applicants/:id')
    async getApplicantDetail(@Param('id') id: string) {
        return this.adminService.getApplicantDetail(id);
    }

    @Post('applicants/:id/status')
    async updateApplicantStatus(
        @Param('id') id: string,
        @Body('status') status: ApplicantStatus,
    ) {
        return this.adminService.updateApplicantStatus(id, status);
    }

    @Post('applicants/:id/decision')
    async makeAdmissionDecision(
        @Param('id') id: string,
        @Body('decision') decision: 'ADMITTED' | 'CONDITIONAL' | 'REJECTED',
        @Body('notes') notes?: string,
    ) {
        return this.adminService.makeAdmissionDecision(id, decision, notes);
    }

    // ===== USERS =====

    @Get('users')
    async getUsers(
        @Query('level') level?: IdentityLevel,
        @Query('active') active?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: number,
        @Query('offset') offset?: number,
    ) {
        const isActive = active === 'true' ? true : active === 'false' ? false : undefined;
        return this.adminService.getUsers({ level, isActive, search, limit, offset });
    }

    @Get('users/:id')
    async getUserDetail(@Param('id') id: string) {
        return this.adminService.getUserDetail(id);
    }

    @Post('users/:id/level')
    async updateUserLevel(
        @Param('id') id: string,
        @Body('level') level: IdentityLevel,
    ) {
        return this.adminService.updateUserLevel(id, level);
    }

    @Post('users/:id/reactivate')
    async reactivateUser(@Param('id') id: string) {
        return this.adminService.reactivateUser(id);
    }
}
