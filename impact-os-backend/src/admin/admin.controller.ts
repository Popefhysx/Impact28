import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  ApplicantStatus,
  IdentityLevel,
  SupportDenialReason,
} from '@prisma/client';
import {
  CapabilityGuard,
  RequireCapability,
  RequireCategory,
} from '../staff/guards';
import { AuthGuard } from '../auth/auth.guard';

@Controller('admin')
@UseGuards(AuthGuard, CapabilityGuard)
export class AdminController {
  constructor(private adminService: AdminService) { }

  // ===== DASHBOARD =====

  @Get('dashboard')
  @RequireCapability('reports.view', 'admissions.manage')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('activity')
  @RequireCapability('audit.view')
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit || 20);
  }

  @Get('cohort/capacity')
  @RequireCapability('cohort.manage', 'reports.view')
  async getCohortCapacity(@Query('cohortId') cohortId?: string) {
    return this.adminService.getCohortCapacity(cohortId);
  }

  // ===== APPLICANTS =====

  @Get('applicants')
  @RequireCapability('admissions.manage', 'participants.view')
  async getApplicants(
    @Query('status') status?: ApplicantStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getApplicants({ status, search, limit, offset });
  }

  @Get('applicants/:id')
  @RequireCapability('admissions.manage', 'participants.view')
  async getApplicantDetail(@Param('id') id: string) {
    return this.adminService.getApplicantDetail(id);
  }

  @Post('applicants/:id/status')
  @RequireCapability('admissions.manage')
  async updateApplicantStatus(
    @Param('id') id: string,
    @Body('status') status: ApplicantStatus,
  ) {
    return this.adminService.updateApplicantStatus(id, status);
  }

  @Post('applicants/:id/decision')
  @RequireCapability('admissions.manage')
  async makeAdmissionDecision(
    @Param('id') id: string,
    @Body('decision') decision: 'ADMITTED' | 'CONDITIONAL' | 'REJECTED',
    @Body('notes') notes?: string,
    @Body('customMessage') customMessage?: string,
    @Body('isCapacityRejection') isCapacityRejection?: boolean,
  ) {
    return this.adminService.makeAdmissionDecision(id, decision, {
      notes,
      customMessage,
      isCapacityRejection,
    });
  }

  @Post('applicants/bulk-decision')
  @RequireCapability('admissions.manage')
  @RequireCategory('ADMIN')
  async makeBulkDecision(
    @Body('applicantIds') applicantIds: string[],
    @Body('decision') decision: 'ADMITTED' | 'CONDITIONAL' | 'REJECTED',
    @Body('notes') notes?: string,
    @Body('customMessage') customMessage?: string,
    @Body('isCapacityRejection') isCapacityRejection?: boolean,
  ) {
    return this.adminService.makeBulkDecision(applicantIds, decision, {
      notes,
      customMessage,
      isCapacityRejection,
    });
  }

  // ===== USERS =====

  @Get('users')
  @RequireCapability('participants.view')
  async getUsers(
    @Query('level') level?: IdentityLevel,
    @Query('active') active?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const isActive =
      active === 'true' ? true : active === 'false' ? false : undefined;
    return this.adminService.getUsers({
      level,
      isActive,
      search,
      limit,
      offset,
    });
  }

  @Get('users/:id')
  @RequireCapability('participants.view')
  async getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Post('users/:id/level')
  @RequireCapability('cohort.manage')
  @RequireCategory('ADMIN')
  async updateUserLevel(
    @Param('id') id: string,
    @Body('level') level: IdentityLevel,
  ) {
    return this.adminService.updateUserLevel(id, level);
  }

  @Post('users/:id/reactivate')
  @RequireCapability('cohort.manage')
  @RequireCategory('ADMIN')
  async reactivateUser(@Param('id') id: string) {
    return this.adminService.reactivateUser(id);
  }

  // ===== SUPPORT REQUESTS =====

  @Get('support-requests')
  @RequireCapability('support.manage')
  async getPendingSupportRequests(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.adminService.getPendingSupportRequests({
      limit: limit || 50,
      offset: offset || 0,
    });
  }

  @Post('support-requests/:id/decision')
  @RequireCapability('support.manage')
  async decideSupportRequest(
    @Param('id') id: string,
    @Body('decision') decision: 'APPROVE' | 'DENY' | 'COMPLETE',
    @Body('denialReasonCode') denialReasonCode?: SupportDenialReason,
    @Body('amount') amount?: number,
    @Body('notes') notes?: string,
  ) {
    return this.adminService.decideSupportRequest(id, decision, {
      denialReasonCode,
      amount,
      notes,
    });
  }
}
