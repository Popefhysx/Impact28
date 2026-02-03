import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PsnService } from '../psn';
import { PrismaService } from '../prisma';
import { MissionEngineService } from '../mission';
import { SupportRequestStatus } from '@prisma/client';

/**
 * Scheduled Tasks Service
 *
 * Contains all scheduled/cron jobs for Impact OS.
 */
@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private psnService: PsnService,
    private prisma: PrismaService,
    private missionEngine: MissionEngineService,
  ) {}

  /**
   * Run behavioral trigger detection daily at 6 AM
   *
   * Detects:
   * - Trigger A: Momentum drops (>20 pts in 7 days)
   * - Trigger B: Phase blockers (stuck for 7+ days)
   * - Trigger C: Repeated near-misses (3+ failed missions in 14 days)
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
   *
   * Users who haven't checked in lose -5 momentum
   * Creates LOW_MOMENTUM alerts if below threshold
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
   *
   * Marks ASSIGNED/IN_PROGRESS missions as EXPIRED if past expiresAt
   * Creates MISSED_MISSIONS alerts for repeat offenders
   */
  @Cron('0 */6 * * *') // Every 6 hours
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
   *
   * Auto-ranks posts based on user's triad score, momentum, streak, etc.
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
   *
   * Marks APPROVED_PENDING_DISBURSE requests as EXPIRED if:
   * - expiresAt is set and has passed
   * - status is still pending disbursement
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleSupportRequestExpiration() {
    this.logger.log('Running support request expiration check...');

    try {
      const now = new Date();

      // Find and update expired requests
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

  /**
   * Manual trigger for testing behavioral detection
   */
  async runDetectionNow() {
    return this.psnService.runBehavioralTriggerDetection();
  }

  /**
   * Manual trigger for testing expiration
   */
  async runExpirationNow() {
    return this.handleSupportRequestExpiration();
  }

  /**
   * Manual trigger for testing momentum decay
   */
  async runDecayNow() {
    return this.missionEngine.applyMomentumDecay();
  }

  /**
   * Manual trigger for testing mission expiry
   */
  async runMissionExpiryNow() {
    return this.missionEngine.expireMissions();
  }
}
