import { Module } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { PrismaModule } from '../prisma';
import { CurrencyModule } from '../currency';
import { MissionModule } from '../mission';
import { StipendModule } from '../stipend';

@Module({
    imports: [
        PrismaModule,
        CurrencyModule,
        MissionModule,
        StipendModule,
    ],
    controllers: [ProgressController],
    providers: [ProgressService],
    exports: [ProgressService],
})
export class ProgressModule { }
