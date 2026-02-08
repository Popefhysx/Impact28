import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { CalendarEngineService } from './calendar-engine.service';
import { GateEnforcementService } from './gate-enforcement.service';
import { StateAuthorityService } from './state-authority.service';
import { PauseEscalationService } from './pause-escalation.service';
import { GraduationAuthorityService } from './graduation-authority.service';
import { CommandCentreController } from './command-centre.controller';

/**
 * Command Centre Module
 *
 * The single authority layer that owns time, gates, enforcement, and graduation decisions.
 * Sits upstream of all other engines (Mission, Currency, Stipend, Support).
 *
 * Components:
 * - CalendarEngineService: Deterministic date calculation from cohort start
 * - GateEnforcementService: Execute Day 1/30/60/90 gates
 * - StateAuthorityService: Participant state machine (ACTIVE → GRADUATED/EXITED)
 * - PauseEscalationService: Automatic pause/reactivation logic
 * - GraduationAuthorityService: Graduation and exit decisions
 */
@Module({
    imports: [PrismaModule],
    controllers: [CommandCentreController],
    providers: [
        CalendarEngineService,
        GateEnforcementService,
        StateAuthorityService,
        PauseEscalationService,
        GraduationAuthorityService,
    ],
    exports: [
        CalendarEngineService,
        GateEnforcementService,
        StateAuthorityService,
        PauseEscalationService,
        GraduationAuthorityService,
    ],
})
export class CommandCentreModule { }
