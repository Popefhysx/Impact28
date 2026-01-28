import { Module } from '@nestjs/common';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { EmailModule } from '../email';
import { ScoringModule } from '../scoring';

@Module({
    imports: [EmailModule, ScoringModule],
    controllers: [IntakeController],
    providers: [IntakeService],
    exports: [IntakeService],
})
export class IntakeModule { }

