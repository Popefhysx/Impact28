import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
} from './email-templates.service';
import { CommunicationSource } from '@prisma/client';

@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly templatesService: EmailTemplatesService) {}

  /**
   * Get all templates
   * GET /api/email-templates?category=INTAKE
   */
  @Get()
  async findAll(@Query('category') category?: CommunicationSource) {
    return this.templatesService.findAll(category);
  }

  /**
   * Get a single template by ID
   * GET /api/email-templates/:id
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  /**
   * Create a new template
   * POST /api/email-templates
   */
  @Post()
  async create(@Body() dto: CreateTemplateDto) {
    return this.templatesService.create(dto);
  }

  /**
   * Update a template
   * PATCH /api/email-templates/:id
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  /**
   * Approve a template
   * POST /api/email-templates/:id/approve
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Body('approvedBy') approvedBy: string,
  ) {
    return this.templatesService.approve(id, approvedBy || 'admin');
  }

  /**
   * Reject changes (revert to previous version)
   * POST /api/email-templates/:id/reject
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string) {
    return this.templatesService.reject(id);
  }

  /**
   * Preview a template with sample data
   * POST /api/email-templates/:id/preview
   */
  @Post(':id/preview')
  @HttpCode(HttpStatus.OK)
  async preview(
    @Param('id') id: string,
    @Body('data') sampleData?: Record<string, string>,
  ) {
    return this.templatesService.preview(id, sampleData);
  }

  /**
   * Deprecate a template (soft delete)
   * POST /api/email-templates/:id/deprecate
   */
  @Post(':id/deprecate')
  @HttpCode(HttpStatus.OK)
  async deprecate(@Param('id') id: string) {
    return this.templatesService.deprecate(id);
  }
}
