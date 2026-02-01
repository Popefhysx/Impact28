import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma';
import { AdmissionModule } from '../admission';
import { AssessmentModule } from '../assessment';
import { MissionModule } from '../mission';

@Module({
    imports: [
        PrismaModule,
        AdmissionModule,
        AssessmentModule,
        MissionModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule { }
