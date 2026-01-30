import { Module } from '@nestjs/common';
import { PsnService } from './psn.service';
import { PsnController } from './psn.controller';
import { PrismaModule } from '../prisma';

/**
 * PSN Module
 * 
 * Predicted Support Need - Internal forecasting and operational planning.
 * 
 * Features:
 * - PSN calculation for admitted applicants
 * - Cohort-level forecast generation
 * - Proactive blocker detection
 * - Admin queue prioritization
 */
@Module({
    imports: [PrismaModule],
    providers: [PsnService],
    controllers: [PsnController],
    exports: [PsnService],
})
export class PsnModule { }
