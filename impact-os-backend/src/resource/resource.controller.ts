import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import {
  CreateResourceDto,
  UpdateResourceDto,
  ResourceQueryDto,
  FetchMetadataDto,
} from './dto';

@Controller()
export class ResourceController {
  constructor(private resourceService: ResourceService) {}

  // ========== PUBLIC ENDPOINTS ==========

  /**
   * Get all approved resources (accessible to all users)
   */
  @Get('resources')
  async getResources(@Query() query: ResourceQueryDto) {
    return this.resourceService.getApprovedResources(query);
  }

  // ========== ADMIN ENDPOINTS ==========

  /**
   * Get all resources including pending/rejected (admin only)
   */
  @Get('admin/resources')
  async getAllResources(@Query() query: ResourceQueryDto) {
    return this.resourceService.getAllResources(query);
  }

  /**
   * Get resource statistics (admin only)
   */
  @Get('admin/resources/stats')
  async getResourceStats() {
    return this.resourceService.getResourceStats();
  }

  /**
   * Fetch metadata from URL (admin only)
   */
  @Post('admin/resources/fetch-metadata')
  async fetchMetadata(@Body() dto: FetchMetadataDto) {
    return this.resourceService.fetchMetadata(dto);
  }

  /**
   * Create a new resource (admin only)
   */
  @Post('admin/resources')
  async createResource(@Body() dto: CreateResourceDto, @Request() req: any) {
    return this.resourceService.createResource(dto, req.user?.id);
  }

  /**
   * Approve a pending resource (admin only)
   */
  @Patch('admin/resources/:id/approve')
  async approveResource(@Param('id') id: string, @Request() req: any) {
    return this.resourceService.approveResource(id, req.user?.id);
  }

  /**
   * Reject a pending resource (admin only)
   */
  @Patch('admin/resources/:id/reject')
  async rejectResource(@Param('id') id: string) {
    return this.resourceService.rejectResource(id);
  }

  /**
   * Update a resource (admin only)
   */
  @Patch('admin/resources/:id')
  async updateResource(
    @Param('id') id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.resourceService.updateResource(id, dto);
  }

  /**
   * Delete a resource (admin only)
   */
  @Delete('admin/resources/:id')
  async deleteResource(@Param('id') id: string) {
    return this.resourceService.deleteResource(id);
  }
}
