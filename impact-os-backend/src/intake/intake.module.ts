import { Module, forwardRef } from '@nestjs/common';
import { IntakeController } from './intake.controller';
import { IntakeService } from './intake.service';
import { EmailModule } from '../email';
import { ScoringModule } from '../scoring';
import { ProgressModule } from '../progress';
import { AuthModule } from '../auth';

@Module({
    imports: [EmailModule, ScoringModule, ProgressModule, forwardRef(() => AuthModule)],
    controllers: [IntakeController],
    providers: [IntakeService],
    exports: [IntakeService],
})
export class IntakeModule { }
