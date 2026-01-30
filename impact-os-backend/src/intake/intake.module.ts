import { Module } from '@nestjs/common';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { EmailModule } from '../email';
import { ScoringModule } from '../scoring';
import { ProgressModule } from '../progress';

@Module({
    imports: [EmailModule, ScoringModule, ProgressModule],
    controllers: [IntakeController],
    providers: [IntakeService],
    exports: [IntakeService],
})
export class IntakeModule { }
