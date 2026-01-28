import { Module, forwardRef } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { PrismaModule } from '../prisma';
import { AdmissionModule } from '../admission';

@Module({
    imports: [PrismaModule, forwardRef(() => AdmissionModule)],
    providers: [ScoringService],
    exports: [ScoringService],
})
export class ScoringModule { }

