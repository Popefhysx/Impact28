import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { PsnModule } from '../psn';
import { PrismaModule } from '../prisma';
import { MissionModule } from '../mission';
import { CommandCentreModule } from '../command-centre';

/**
 * Scheduled Tasks Module
 *
 * Contains all cron jobs and scheduled tasks.
 * Import this module in AppModule to enable scheduling.
 */
@Module({
  imports: [ScheduleModule.forRoot(), PsnModule, PrismaModule, MissionModule, CommandCentreModule],
  providers: [ScheduledTasksService],
  exports: [ScheduledTasksService],
})
export class ScheduledTasksModule { }
