import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CurrencyService } from '../currency';
import {
  AlertType,
  AlertSeverity,
  CurrencyType,
  MissionStatus,
  SkillDomain,
} from '@prisma/client';

/**
 * Mission Engine Service
 *
 * Core enforcement logic for Impact OS:
 * 1. Skill Triad score management
 * 2. Momentum decay
 * 3. Streak tracking
 * 4. Intervention alerts
 * 5. Wall post ranking
 */
@Injectable()
export class MissionEngineService {
  private readonly logger = new Logger(MissionEngineService.name);

  // Score weights by difficulty
  private readonly DIFFICULTY_WEIGHTS = {
    EASY: 5,
    MEDIUM: 10,
    HARD: 20,
  };

  // Intervention thresholds
  private readonly THRESHOLDS = {
    LOW_MOMENTUM: 30,
    MISSED_MISSIONS_COUNT: 3,
    INACTIVE_DAYS: 7,
    TRIAD_IMBALANCE: 20,
  };

  constructor(
    private prisma: PrismaService,
    private currencyService: CurrencyService,
  ) {}

  // ===== SKILL TRIAD MANAGEMENT =====

  /**
   * Get or create triad score for user
   */
  async getTriadScore(userId: string) {
    let score = await this.prisma.skillTriadScore.findUnique({
      where: { userId },
    });

    if (!score) {
      score = await this.prisma.skillTriadScore.create({
        data: { userId },
      });
    }

    return score;
  }

  /**
   * Update triad score on mission completion
   */
  async updateTriadScore(
    userId: string,
    domain: SkillDomain,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  ) {
    const weight = this.DIFFICULTY_WEIGHTS[difficulty];
    const score = await this.getTriadScore(userId);

    const field = domain.toLowerCase() as 'technical' | 'soft' | 'commercial';
    const newValue = Math.min(100, score[field] + weight);

    await this.prisma.skillTriadScore.update({
      where: { userId },
      data: { [field]: newValue },
    });

    // Check for triad imbalance
    await this.checkTriadImbalance(userId);

    return { domain, previousValue: score[field], newValue };
  }

  /**
   * Check for triad imbalance and create alert if needed
   */
  async checkTriadImbalance(userId: string) {
    const score = await this.getTriadScore(userId);
    const values = [score.technical, score.soft, score.commercial];
    const max = Math.max(...values);
    const min = Math.min(...values);

    // If one domain is significantly behind
    if (max > 50 && min < this.THRESHOLDS.TRIAD_IMBALANCE) {
      const lowDomain =
        score.technical < this.THRESHOLDS.TRIAD_IMBALANCE
          ? 'Technical'
          : score.soft < this.THRESHOLDS.TRIAD_IMBALANCE
            ? 'Soft'
            : 'Commercial';

      await this.createInterventionAlert(userId, AlertType.TRIAD_IMBALANCE, {
        message: `${lowDomain} skills need attention`,
        severity: AlertSeverity.MEDIUM,
      });
    }
  }

  // ===== MOMENTUM DECAY =====

  /**
   * Apply momentum decay for inactive users
   * Called by cron job daily
   */
  async applyMomentumDecay() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get users who haven't checked in today
    const usersWithoutCheckIn = await this.prisma.user.findMany({
      where: {
        isActive: true,
        OR: [{ lastCheckIn: null }, { lastCheckIn: { lt: yesterday } }],
      },
      select: { id: true, lastCheckIn: true },
    });

    const results = {
      processed: 0,
      decayed: 0,
      alertsCreated: 0,
    };

    for (const user of usersWithoutCheckIn) {
      results.processed++;

      // Apply decay
      const decayAmount = 5; // -5 momentum per day
      await this.currencyService.debit(
        user.id,
        CurrencyType.MOMENTUM,
        decayAmount,
        'DECAY_INACTIVE',
      );
      results.decayed++;

      // Log behavior
      await this.logBehavior(user.id, 'MOMENTUM_DECAY', {
        amount: decayAmount,
        lastCheckIn: user.lastCheckIn,
      });

      // Check if momentum is now low
      const balance = await this.currencyService.getBalance(user.id);
      if (balance.momentum < this.THRESHOLDS.LOW_MOMENTUM) {
        await this.createInterventionAlert(user.id, AlertType.LOW_MOMENTUM, {
          severity: AlertSeverity.HIGH,
          message: `Momentum at ${balance.momentum}`,
        });
        results.alertsCreated++;
      }
    }

    this.logger.log(
      `Momentum decay: ${results.decayed} users decayed, ${results.alertsCreated} alerts`,
    );
    return results;
  }

  // ===== MISSION EXPIRY =====

  /**
   * Expire overdue missions
   * Called by cron job every 6 hours
   */
  async expireMissions() {
    const now = new Date();

    const expired = await this.prisma.missionAssignment.updateMany({
      where: {
        status: { in: [MissionStatus.ASSIGNED, MissionStatus.IN_PROGRESS] },
        expiresAt: { lte: now },
      },
      data: {
        status: MissionStatus.EXPIRED,
      },
    });

    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} missions`);

      // Check for users with too many expired missions
      await this.checkMissedMissions();
    }

    return { expiredCount: expired.count };
  }

  /**
   * Check for users with too many missed missions
   */
  async checkMissedMissions() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usersWithMissed = await this.prisma.missionAssignment.groupBy({
      by: ['userId'],
      where: {
        status: { in: [MissionStatus.EXPIRED, MissionStatus.FAILED] },
        assignedAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
      having: {
        id: { _count: { gte: this.THRESHOLDS.MISSED_MISSIONS_COUNT } },
      },
    });

    for (const user of usersWithMissed) {
      await this.createInterventionAlert(
        user.userId,
        AlertType.MISSED_MISSIONS,
        {
          severity: AlertSeverity.HIGH,
          message: `${user._count.id} missed missions in 7 days`,
        },
      );
    }
  }

  // ===== STREAK TRACKING =====

  /**
   * Process check-in and update streak
   */
  async processCheckIn(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastCheckIn: true, currentStreak: true },
    });

    if (!user) return null;

    const today = new Date();
    const isConsecutive =
      user.lastCheckIn && this.isConsecutiveDay(user.lastCheckIn, today);

    const newStreak = isConsecutive ? user.currentStreak + 1 : 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastCheckIn: today,
        currentStreak: newStreak,
      },
    });

    // Streak bonuses
    let bonus = 0;
    if (newStreak === 7) bonus = 50;
    else if (newStreak === 14) bonus = 100;
    else if (newStreak === 30) bonus = 200;

    if (bonus > 0) {
      await this.currencyService.credit(
        userId,
        CurrencyType.MOMENTUM,
        bonus,
        `STREAK_BONUS_${newStreak}`,
      );
    }

    // Log behavior
    await this.logBehavior(userId, 'CHECKIN', {
      streak: newStreak,
      bonus,
    });

    return { streak: newStreak, bonus };
  }

  private isConsecutiveDay(lastDate: Date, today: Date): boolean {
    const last = new Date(lastDate);
    last.setHours(0, 0, 0, 0);
    const now = new Date(today);
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.floor(
      (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays === 1;
  }

  // ===== INTERVENTION ALERTS =====

  /**
   * Create intervention alert if not already active
   */
  async createInterventionAlert(
    userId: string,
    type: AlertType,
    options: { severity?: AlertSeverity; message?: string } = {},
  ) {
    // Check for existing unresolved alert of same type
    const existing = await this.prisma.interventionAlert.findFirst({
      where: {
        userId,
        type,
        resolvedAt: null,
      },
    });

    if (existing) return existing;

    const alert = await this.prisma.interventionAlert.create({
      data: {
        userId,
        type,
        severity: options.severity || AlertSeverity.MEDIUM,
        message: options.message,
      },
    });

    this.logger.log(`Intervention alert created: ${type} for user ${userId}`);
    return alert;
  }

  /**
   * Get pending alerts for admin dashboard
   */
  async getPendingAlerts(limit = 50) {
    return this.prisma.interventionAlert.findMany({
      where: { resolvedAt: null },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            identityLevel: true,
          },
        },
      },
      orderBy: [{ severity: 'desc' }, { triggeredAt: 'asc' }],
      take: limit,
    });
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, notes?: string) {
    return this.prisma.interventionAlert.update({
      where: { id: alertId },
      data: {
        resolvedAt: new Date(),
        resolvedBy,
        notes,
      },
    });
  }

  // ===== WALL POST RANKING =====

  /**
   * Recalculate rank scores for all published wall posts
   * Called by cron job hourly
   */
  async recalculateWallRanks() {
    const posts = await this.prisma.wallPost.findMany({
      where: { status: 'PUBLISHED' },
      include: { user: true },
    });

    let updated = 0;

    for (const post of posts) {
      const triad = await this.getTriadScore(post.userId);
      const balance = await this.currencyService.getBalance(post.userId);

      // Calculate rank score
      const triadBalance =
        (triad.technical + triad.soft + triad.commercial) / 3;
      const streakBonus = Math.min(post.user.currentStreak * 2, 30);
      const arenaBonus = balance.arenaPoints / 10;
      const hashtagBonus = post.usedHashtag ? 10 : 0;
      const recencyBonus = this.getRecencyScore(post.submittedAt);

      const rankScore =
        triadBalance +
        balance.momentum +
        streakBonus +
        arenaBonus +
        hashtagBonus +
        recencyBonus;

      await this.prisma.wallPost.update({
        where: { id: post.id },
        data: { rankScore },
      });

      updated++;
    }

    this.logger.log(`Wall ranks recalculated: ${updated} posts`);
    return { updatedCount: updated };
  }

  private getRecencyScore(submittedAt: Date): number {
    const daysSincePost =
      (Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24);
    // Newer posts get higher scores, max 30 for today
    return Math.max(0, 30 - daysSincePost * 2);
  }

  /**
   * Get ranked wall posts for public display
   */
  async getWallPosts(limit = 50, offset = 0) {
    const [posts, featured] = await Promise.all([
      this.prisma.wallPost.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              identityLevel: true,
              instagramHandle: true,
              twitterHandle: true,
            },
          },
        },
        orderBy: { rankScore: 'desc' },
        skip: offset,
        take: limit,
      }),
      // Top 3 for featured section
      this.prisma.wallPost.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              identityLevel: true,
            },
          },
        },
        orderBy: { rankScore: 'desc' },
        take: 3,
      }),
    ]);

    return { posts, featured };
  }

  /**
   * Log identity level upgrade/change
   */
  async logIdentityUpgrade(
    userId: string,
    previousLevel: string,
    newLevel: string,
    reason: string,
  ) {
    if (previousLevel === newLevel) return;

    this.logger.log(
      `Identity upgrade for ${userId}: ${previousLevel} -> ${newLevel} (${reason})`,
    );

    return this.logBehavior(userId, 'IDENTITY_UPGRADE', {
      previousLevel,
      newLevel,
      reason,
      timestamp: new Date(),
    });
  }

  /**
   * Get identity history for a user
   */
  async getIdentityHistory(userId: string) {
    const logs = await this.prisma.behaviorLog.findMany({
      where: {
        userId,
        eventType: 'IDENTITY_UPGRADE',
      },
      orderBy: { timestamp: 'asc' },
    });

    return logs.map((log) => ({
      level: (log.eventData as any).newLevel,
      previousLevel: (log.eventData as any).previousLevel,
      reason: (log.eventData as any).reason,
      achievedAt: log.timestamp,
    }));
  }

  // ===== BEHAVIOR LOGGING =====

  /**
   * Log behavioral event
   */
  async logBehavior(userId: string, eventType: string, eventData?: any) {
    return this.prisma.behaviorLog.create({
      data: {
        userId,
        eventType,
        eventData: eventData || {},
      },
    });
  }
}
