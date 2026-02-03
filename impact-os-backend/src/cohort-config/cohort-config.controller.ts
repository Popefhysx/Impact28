import { Controller, Get, Put, Post, Body, Param, Query } from '@nestjs/common';
import { CohortConfigService } from './cohort-config.service';
import { UpdateCohortConfigDto } from './dto';

@Controller('cohort-config')
export class CohortConfigController {
  constructor(private readonly cohortConfigService: CohortConfigService) {}

  // GET /cohort-config - Public: Get active cohort config for frontend
  @Get()
  getActiveConfig() {
    return this.cohortConfigService.getActiveConfig();
  }

  // GET /cohort-config/admin/cohorts - Admin: List all cohorts
  @Get('admin/cohorts')
  getAllCohorts() {
    // TODO: Add auth guard
    return this.cohortConfigService.getAllCohorts();
  }

  // GET /cohort-config/admin/:cohortId - Admin: Get specific cohort config
  @Get('admin/:cohortId')
  getConfigByCohortId(@Param('cohortId') cohortId: string) {
    return this.cohortConfigService.getConfigByCohortId(cohortId);
  }

  // PUT /cohort-config/admin/:cohortId - Admin: Update cohort config
  @Put('admin/:cohortId')
  updateConfig(
    @Param('cohortId') cohortId: string,
    @Body() dto: UpdateCohortConfigDto,
  ) {
    // TODO: Get updatedBy from auth context
    return this.cohortConfigService.updateConfig(cohortId, dto, 'admin');
  }

  // POST /cohort-config/admin/cohorts - Admin: Create new cohort
  @Post('admin/cohorts')
  createCohort(
    @Body('name') name: string,
    @Body('startDate') startDate: string,
    @Body('capacity') capacity?: number,
  ) {
    return this.cohortConfigService.createCohort(
      name,
      new Date(startDate),
      capacity,
    );
  }
}
