import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import {
  CommunicationsService,
  CommunicationStats,
  CommunicationLogItem,
  PaginatedResponse,
} from './communications.service';
import { DeliveryStatus, CommunicationSource } from '@prisma/client';

/**
 * Communications Controller
 *
 * Admin endpoints for viewing and managing communication logs.
 */
@Controller('admin/communications')
export class CommunicationsController {
  constructor(private communicationsService: CommunicationsService) {}

  /**
   * GET /api/admin/communications/stats
   * Get overall communication statistics
   */
  @Get('stats')
  async getStats(): Promise<CommunicationStats> {
    return this.communicationsService.getStats();
  }

  /**
   * GET /api/admin/communications
   * Get paginated communication logs with optional filters
   */
  @Get()
  async getLogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: DeliveryStatus,
    @Query('source') source?: CommunicationSource,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<PaginatedResponse<CommunicationLogItem>> {
    return this.communicationsService.getLogs({
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
      status,
      source,
      search,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * GET /api/admin/communications/failures
   * Get recent failures for quick review
   */
  @Get('failures')
  async getFailures(
    @Query('limit') limit?: string,
  ): Promise<CommunicationLogItem[]> {
    return this.communicationsService.getFailedEmails(
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * GET /api/admin/communications/:id
   * Get detailed view of a single communication log
   */
  @Get(':id')
  async getLogDetail(@Param('id') id: string) {
    return this.communicationsService.getLogDetail(id);
  }

  /**
   * POST /api/admin/communications/:id/retry
   * Retry sending a failed email
   */
  @Post(':id/retry')
  async retryEmail(@Param('id') id: string) {
    return this.communicationsService.retryEmail(id);
  }

  // =========================================================================
  // TEMPLATE ENDPOINTS
  // =========================================================================

  /**
   * GET /api/admin/communications/templates
   * Get all templates
   */
  @Get('templates')
  async getTemplates(@Query('category') category?: CommunicationSource) {
    return this.communicationsService.getTemplates(category);
  }

  /**
   * GET /api/admin/communications/templates/:slug
   * Get a template by slug
   */
  @Get('templates/:slug')
  async getTemplate(@Param('slug') slug: string) {
    return this.communicationsService.getTemplateBySlug(slug);
  }

  /**
   * POST /api/admin/communications/templates
   * Create a new template
   */
  @Post('templates')
  async createTemplate(
    @Body()
    data: {
      name: string;
      slug: string;
      category: CommunicationSource;
      subject: string;
      htmlContent: string;
      variables?: Array<{
        name: string;
        description?: string;
        required?: boolean;
      }>;
    },
  ) {
    return this.communicationsService.createTemplate(data);
  }

  /**
   * PUT /api/admin/communications/templates/:id
   * Update a template
   */
  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      subject?: string;
      htmlContent?: string;
      variables?: Array<{
        name: string;
        description?: string;
        required?: boolean;
      }>;
      isActive?: boolean;
    },
  ) {
    return this.communicationsService.updateTemplate(id, data);
  }

  /**
   * DELETE /api/admin/communications/templates/:id
   * Delete a template
   */
  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.communicationsService.deleteTemplate(id);
  }

  // =========================================================================
  // RECIPIENT SEARCH
  // =========================================================================

  /**
   * GET /api/admin/communications/recipients/search
   * Search for recipients
   */
  @Get('recipients/search')
  async searchRecipients(
    @Query('q') query: string,
    @Query('type') type?: 'user' | 'applicant',
  ) {
    if (!query || query.length < 2) {
      return [];
    }
    return this.communicationsService.searchRecipients(query, type);
  }

  // =========================================================================
  // SEGMENT BUILDER
  // =========================================================================

  /**
   * GET /api/admin/communications/segments/cohorts
   * Get available cohorts for segment selection
   */
  @Get('segments/cohorts')
  async getCohorts() {
    return this.communicationsService.getCohorts();
  }

  /**
   * POST /api/admin/communications/segments/preview
   * Preview recipient count for a segment
   */
  @Post('segments/preview')
  async previewSegment(
    @Body()
    segment: {
      type: 'all' | 'cohort' | 'phase' | 'custom';
      cohortId?: string;
      phase?: string;
      customIds?: string[];
    },
  ) {
    const count = await this.communicationsService.getSegmentCount(segment);
    return { count };
  }

  /**
   * POST /api/admin/communications/segments/recipients
   * Get full recipient list for a segment
   */
  @Post('segments/recipients')
  async getSegmentRecipients(
    @Body()
    segment: {
      type: 'all' | 'cohort' | 'phase' | 'custom';
      cohortId?: string;
      phase?: string;
      customIds?: string[];
    },
  ) {
    return this.communicationsService.getRecipientsBySegment(segment);
  }

  // =========================================================================
  // BULK SEND
  // =========================================================================

  /**
   * POST /api/admin/communications/bulk-send
   * Queue a bulk email send
   */
  @Post('bulk-send')
  async bulkSend(
    @Body()
    data: {
      subject: string;
      htmlContent: string;
      segment: {
        type: 'all' | 'cohort' | 'phase' | 'custom';
        cohortId?: string;
        phase?: string;
        customIds?: string[];
      };
      triggeredBy?: string;
    },
  ) {
    return this.communicationsService.queueBulkSend({
      subject: data.subject,
      htmlContent: data.htmlContent,
      segment: data.segment,
      triggeredBy: data.triggeredBy || 'ADMIN',
    });
  }
}
