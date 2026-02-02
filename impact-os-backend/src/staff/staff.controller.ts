import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StaffService } from './staff.service';
import { InviteStaffDto, UpdateStaffDto, AcceptStaffInviteDto } from './dto';
import { StaffCategory } from '@prisma/client';

/**
 * Staff Management Controller
 * 
 * REST endpoints for managing staff members.
 * All endpoints require authentication (to be enforced by guards).
 */
@Controller('staff')
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    /**
     * GET /staff/validate-invite/:token
     * Validate an invite token (public endpoint for setup page)
     */
    @Get('validate-invite/:token')
    async validateInvite(@Param('token') token: string) {
        return this.staffService.validateInviteToken(token);
    }

    /**
     * POST /staff/accept-invite/:token
     * Accept an invite and set up credentials (public endpoint)
     */
    @Post('accept-invite/:token')
    async acceptInvite(
        @Param('token') token: string,
        @Body() dto: AcceptStaffInviteDto,
    ) {
        return this.staffService.acceptInvite(
            token,
            dto.firstName,
            dto.lastName,
            dto.username,
            dto.pin,
        );
    }

    /**
     * POST /staff/invite
     * Invite a new staff member
     */
    @Post('invite')
    async inviteStaff(@Body() dto: InviteStaffDto) {
        // TODO: Get actual inviter ID from auth context
        const inviterId = 'system';
        return this.staffService.inviteStaff(dto, inviterId);
    }

    /**
     * GET /staff
     * List all staff members with optional filtering
     */
    @Get()
    async getStaffMembers(
        @Query('category') category?: StaffCategory,
        @Query('isActive') isActive?: string,
        @Query('search') search?: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.staffService.getStaffMembers({
            category,
            isActive: isActive === 'false' ? false : true,
            search,
            limit: limit ? parseInt(limit, 10) : undefined,
            offset: offset ? parseInt(offset, 10) : undefined,
        });
    }

    /**
     * GET /staff/templates
     * Get capability templates and groups for the UI
     */
    @Get('templates')
    getCapabilityTemplates() {
        return this.staffService.getCapabilityTemplates();
    }

    /**
     * GET /staff/cohorts
     * Get available cohorts for scope assignment
     */
    @Get('cohorts')
    async getAvailableCohorts() {
        return this.staffService.getAvailableCohorts();
    }

    /**
     * GET /staff/:id
     * Get detailed information about a staff member
     */
    @Get(':id')
    async getStaffDetail(@Param('id') id: string) {
        return this.staffService.getStaffDetail(id);
    }

    /**
     * PATCH /staff/:id
     * Update a staff member's capabilities or scope
     */
    @Patch(':id')
    async updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
        return this.staffService.updateStaff(id, dto);
    }

    /**
     * DELETE /staff/:id
     * Deactivate a staff member
     */
    @Delete(':id')
    async deactivateStaff(@Param('id') id: string) {
        return this.staffService.deactivateStaff(id);
    }

    /**
     * POST /staff/:id/reactivate
     * Reactivate a deactivated staff member
     */
    @Post(':id/reactivate')
    async reactivateStaff(@Param('id') id: string) {
        return this.staffService.reactivateStaff(id);
    }
}
