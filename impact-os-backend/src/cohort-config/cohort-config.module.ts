import { Module } from '@nestjs/common';
import { CohortConfigController } from './cohort-config.controller';
import { CohortConfigService } from './cohort-config.service';

@Module({
    controllers: [CohortConfigController],
    providers: [CohortConfigService],
    exports: [CohortConfigService],
})
export class CohortConfigModule { }
