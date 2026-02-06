import { Module, forwardRef } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma';
import { AdmissionModule } from '../admission';
import { AssessmentModule } from '../assessment';
import { MissionModule } from '../mission';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [PrismaModule, AdmissionModule, AssessmentModule, MissionModule, forwardRef(() => ScoringModule)],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule { }
