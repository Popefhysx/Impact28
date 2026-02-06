import { Module, forwardRef } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { PrismaModule } from '../prisma';
import { AdmissionModule } from '../admission';
import { AssessmentModule } from '../assessment';

@Module({
  imports: [PrismaModule, forwardRef(() => AdmissionModule), forwardRef(() => AssessmentModule)],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule { }
