import { Module } from '@nestjs/common';
import { MissionService } from './mission.service';
import { MissionEngineService } from './mission-engine.service';
import { MissionController } from './mission.controller';
import { PrismaModule } from '../prisma';
import { CurrencyModule } from '../currency';

@Module({
  imports: [PrismaModule, CurrencyModule],
  controllers: [MissionController],
  providers: [MissionService, MissionEngineService],
  exports: [MissionService, MissionEngineService],
})
export class MissionModule {}
