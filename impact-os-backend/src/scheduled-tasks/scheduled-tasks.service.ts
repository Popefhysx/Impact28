import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PsnService } from '../psn';
import { PrismaService } from '../prisma';
import { MissionEngineService } from '../mission';
import { SupportRequestStatus } from '@prisma/client';
import { CalendarEngineService } from '../command-centre/calendar-engine.service';
import { GateEnforcementService } from '../command-centre/gate-enforcement.service';
import { PauseEscalationService } from '../command-centre/pause-escalation.service';

/**
 * Scheduled Tasks Service
 *
 * Contains all scheduled/cron jobs for Impact OS.
 * Now includes Command Centre gate execution, phase updates, and pause checks.
 */
@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private psnService: PsnService,
    private prisma: PrismaService,
    private missionEngine: MissionEngineService,
    private calendarEngine: CalendarEngineService,
    private gateEnforcement: GateEnforcementService,
    private pauseEscalation: PauseEscalationService,
  ) { }

  // ============================================================================
  // COMMAND CENTRE SCHEDULED TASKS
  // ============================================================================

  /**
   * Update cohort day and phase daily at midnight
   * This is the clock tick for the entire system.
   */
  @Cron('0 0 * * *') // Daily at midnight
  async handleCohortDayUpdate() {
    this.logger.log('[Command Centre] Updating cohort days and phases...');

    try {
      const result = await this.calendarEngine.updateAllCohorts();
      this.logger.log(
        `[Command Centre] Updated ${result.updated} cohort(s)`,
      );
    } catch (error) {
      this.logger.error('[Command Centre] Cohort day update failed:', error);
    }
  }

  /**
   * Execute gates at 00:05 daily
   * Gates run via cron at 00:05 on gate day (idempotent).
   * No manual override during execution window.
   */
  @Cron('5 0 * * *') // Daily at 00:05
  async handleGateExecution() {
    this.logger.log('[Command Centre] Running gate execution check...');

    try {
      const result = await this.gateEnforcement.executeDueGates();

      if (result.gatesExecuted > 0) {
        this.logger.log(
          `[Command Centre] Executed ${result.gatesExecuted} gate(s) across ${result.cohortsProcessed} cohort(s)`,
        );
        for (const r of result.results) {
          this.logger.log(
            `  Gate ${r.gateType}: ${r.passed} PASS, ${r.failed} FAIL, ${r.intervention} INTERVENTION`,
          );
        }
      } else {
        this.logger.debug('[Command Centre] No gates due today');
      }
    } catch (error) {
      this.logger.error('[Command Centre] Gate execution failed:', error);
    }
  }

  /**
   * Run automatic pause checks daily at 6 AM
   * Checks momentum thresholds, inactivity, and unresolved gates.
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleAutoPauseCheck() {
    this.logger.log('[Command Centre] Running auto-pause check...');

    try {
      const result = await this.pauseEscalation.runAutoPauseCheck();
      const total =
        result.lowMomentum + result.inactivity + result.unresolvedGates;

      if (total > 0) {
        this.logger.log(
          `[Command Centre] Auto-paused ${total} participant(s): ` +
          `momentum=${result.lowMomentum}, inactivity=${result.inactivity}, gates=${result.unresolvedGates}`,
        );
      }
    } catch (error) {
      this.logger.error('[Command Centre] Auto-pause check failed:', error);
    }
  }

  // ============================================================================
  // EXISTING SCHEDULED TASKS
  // ============================================================================

  /**
   * Run behavioral trigger detection daily at 6 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleBehavioralTriggerDetection() {
    this.logger.log('Running daily behavioral trigger detection...');

    try {
      const result = await this.psnService.runBehavioralTriggerDetection();

      this.logger.log(
        `Behavioral trigger detection complete: ` +
        `${result.triggersCreated} triggers for ${result.participantsChecked} participants`,
      );

      if (result.triggersCreated > 0) {
        this.logger.log(
          `Triggers by type: ${JSON.stringify(result.triggersByType)}`,
        );
      }
    } catch (error) {
      this.logger.error('Behavioral trigger detection failed:', error);
    }
  }

  /**
   * Apply momentum decay daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleMomentumDecay() {
    this.logger.log('Running daily momentum decay...');

    try {
      const result = await this.missionEngine.applyMomentumDecay();

      this.logger.log(
        `Momentum decay complete: ${result.decayed} users decayed, ${result.alertsCreated} alerts`,
      );
    } catch (error) {
      this.logger.error('Momentum decay failed:', error);
    }
  }

  /**
   * Expire overdue missions every 6 hours
   */
  @Cron('0 */6 * * *')
  async handleMissionExpiry() {
    this.logger.log('Running mission expiry check...');

    try {
      const result = await this.missionEngine.expireMissions();

      if (result.expiredCount > 0) {
        this.logger.log(`Expired ${result.expiredCount} missions`);
      }
    } catch (error) {
      this.logger.error('Mission expiry check failed:', error);
    }
  }

  /**
   * Recalculate Wall post ranks every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleWallRankRecalculation() {
    this.logger.log('Recalculating Wall post ranks...');

    try {
      const result = await this.missionEngine.recalculateWallRanks();

      this.logger.log(`Wall ranks updated: ${result.updatedCount} posts`);
    } catch (error) {
      this.logger.error('Wall rank recalculation failed:', error);
    }
  }

  /**
   * Expire stale support requests every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleSupportRequestExpiration() {
    this.logger.log('Running support request expiration check...');

    try {
      const now = new Date();

      const result = await this.prisma.supportRequest.updateMany({
        where: {
          status: SupportRequestStatus.APPROVED_PENDING_DISBURSE,
          expiresAt: {
            lte: now,
          },
        },
        data: {
          status: SupportRequestStatus.EXPIRED,
        },
      });

      if (result.count > 0) {
        this.logger.log(`Expired ${result.count} support request(s)`);
      } else {
        this.logger.debug('No support requests expired');
      }

      return { expiredCount: result.count };
    } catch (error) {
      this.logger.error('Support request expiration failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // MANUAL TRIGGERS (Testing)
  // ============================================================================

  async runDetectionNow() {
    return this.psnService.runBehavioralTriggerDetection();
  }

  async runExpirationNow() {
    return this.handleSupportRequestExpiration();
  }

  async runDecayNow() {
    return this.missionEngine.applyMomentumDecay();
  }

  async runMissionExpiryNow() {
    return this.missionEngine.expireMissions();
  }

  async runGateExecutionNow() {
    return this.gateEnforcement.executeDueGates();
  }

  async runPauseCheckNow() {
    return this.pauseEscalation.runAutoPauseCheck();
  }
}
