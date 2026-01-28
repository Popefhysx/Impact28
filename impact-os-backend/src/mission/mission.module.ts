import { Module } from '@nestjs/common';
import { MissionService } from './mission.service';
import { MissionController } from './mission.controller';
import { PrismaModule } from '../prisma';
import { CurrencyModule } from '../currency';

@Module({
    imports: [PrismaModule, CurrencyModule],
    controllers: [MissionController],
    providers: [MissionService],
    exports: [MissionService],
})
export class MissionModule { }
