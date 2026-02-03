import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  CreatePhaseDto,
  UpdatePhaseDto,
  ReorderPhasesDto,
  CreateCalendarEventDto,
  UpdateCalendarEventDto,
  UpdateProgramConfigDto,
  CreateCohortDto,
  UpdateCohortDto,
} from './dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // =========================================================================
  // PHASES
  // =========================================================================

  @Get('phases')
  async listPhases() {
    return this.settingsService.listPhases();
  }

  @Post('phases')
  async createPhase(@Body() dto: CreatePhaseDto) {
    return this.settingsService.createPhase(dto);
  }

  @Patch('phases/:id')
  async updatePhase(@Param('id') id: string, @Body() dto: UpdatePhaseDto) {
    return this.settingsService.updatePhase(id, dto);
  }

  @Delete('phases/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhase(@Param('id') id: string) {
    await this.settingsService.deletePhase(id);
  }

  @Post('phases/reorder')
  async reorderPhases(@Body() dto: ReorderPhasesDto) {
    return this.settingsService.reorderPhases(dto);
  }

  // =========================================================================
  // CALENDAR EVENTS
  // =========================================================================

  @Get('calendar')
  async listCalendarEvents(@Query('cohortId') cohortId?: string) {
    return this.settingsService.listCalendarEvents(cohortId);
  }

  @Post('calendar')
  async createCalendarEvent(@Body() dto: CreateCalendarEventDto) {
    return this.settingsService.createCalendarEvent(dto);
  }

  @Patch('calendar/:id')
  async updateCalendarEvent(
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.settingsService.updateCalendarEvent(id, dto);
  }

  @Delete('calendar/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCalendarEvent(@Param('id') id: string) {
    await this.settingsService.deleteCalendarEvent(id);
  }

  // =========================================================================
  // PROGRAM CONFIG
  // =========================================================================

  @Get('config')
  async getProgramConfig() {
    return this.settingsService.getProgramConfig();
  }

  @Patch('config')
  async updateProgramConfig(@Body() dto: UpdateProgramConfigDto) {
    return this.settingsService.updateProgramConfig(dto);
  }

  // =========================================================================
  // COHORTS
  // =========================================================================

  @Get('cohorts')
  async listCohorts() {
    return this.settingsService.listCohorts();
  }

  @Get('cohorts/:id')
  async getCohort(@Param('id') id: string) {
    return this.settingsService.getCohort(id);
  }

  @Post('cohorts')
  async createCohort(@Body() dto: CreateCohortDto) {
    return this.settingsService.createCohort(dto);
  }

  @Patch('cohorts/:id')
  async updateCohort(@Param('id') id: string, @Body() dto: UpdateCohortDto) {
    return this.settingsService.updateCohort(id, dto);
  }

  @Delete('cohorts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCohort(@Param('id') id: string) {
    try {
      await this.settingsService.deleteCohort(id);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
