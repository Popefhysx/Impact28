import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma';
import { EmailService } from '../email';
import * as crypto from 'crypto';

// Simple JWT-like token (for demo — use @nestjs/jwt in production)
interface TokenPayload {
    userId: string;
    email: string;
    exp: number;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly jwtSecret: string;
    private readonly otpExpiryMinutes = 10;
    private readonly tokenExpiryDays = 30;

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private configService: ConfigService,
    ) {
        this.jwtSecret = this.configService.get('JWT_SECRET') || 'impact-os-dev-secret-change-in-prod';
    }

    /**
     * Check if email exists in our system
     */
    async checkEmail(email: string): Promise<{ exists: boolean; firstName?: string }> {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { firstName: true },
        });

        return {
            exists: !!user,
            firstName: user?.firstName,
        };
    }

    /**
     * Generate and send OTP code
     */
    async requestOtp(email: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
        const normalizedEmail = email.toLowerCase();
        const isDev = process.env.NODE_ENV !== 'production';

        // Check if user exists
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            // Don't reveal if email exists for security
            this.logger.warn(`OTP requested for non-existent email: ${normalizedEmail}`);
            // Still return success to prevent email enumeration
            return {
                success: true,
                message: 'If this email is registered, you will receive a code shortly.'
            };
        }

        // Generate 6-digit OTP
        const otpCode = this.generateOtp();
        const otpExpiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60 * 1000);

        // Store OTP
        await this.prisma.user.update({
            where: { id: user.id },
            data: { otpCode, otpExpiresAt },
        });

        // In dev mode, skip email and log OTP to console
        if (isDev) {
            this.logger.log(`[DEV MODE] OTP for ${normalizedEmail}: ${otpCode}`);
            this.logger.log(`[DEV MODE] Use code "000000" to bypass OTP verification`);
            return {
                success: true,
                message: '[DEV] Code sent. Check console or use "000000" to bypass.',
                devOtp: otpCode, // Return OTP in dev mode for testing
            };
        }

        // Send OTP via email (production only)
        await this.emailService.sendOtpEmail(normalizedEmail, {
            firstName: user.firstName,
            otpCode,
            expiryMinutes: this.otpExpiryMinutes,
        });

        this.logger.log(`OTP sent to ${normalizedEmail}`);

        return {
            success: true,
            message: 'Verification code sent to your email.',
        };
    }

    /**
     * Verify OTP and return JWT token
     */
    async verifyOtp(email: string, code: string): Promise<{
        success: boolean;
        token?: string;
        user?: { id: string; email: string; firstName: string; lastName: string };
        message?: string;
    }> {
        const normalizedEmail = email.toLowerCase();

        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or code');
        }

        // Check OTP - In dev mode, accept "000000" as bypass code
        const isDev = process.env.NODE_ENV !== 'production';
        const isValidOtp = (isDev && code === '000000') || (user.otpCode && user.otpCode === code);

        if (!isValidOtp) {
            throw new UnauthorizedException('Invalid code');
        }

        // Check expiry (skip in dev mode with bypass code)
        if (!(isDev && code === '000000')) {
            if (!user.otpExpiresAt || new Date() > user.otpExpiresAt) {
                throw new UnauthorizedException('Code has expired. Please request a new one.');
            }
        }

        // Clear OTP and update login time
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                otpCode: null,
                otpExpiresAt: null,
                lastLoginAt: new Date(),
            },
        });

        // Generate JWT token
        const token = this.generateToken(user.id, user.email);

        this.logger.log(`User ${user.email} authenticated successfully`);

        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            },
        };
    }

    /**
     * Get current user from token
     */
    async getCurrentUser(token: string) {
        const payload = this.verifyToken(token);

        if (!payload) {
            throw new UnauthorizedException('Invalid or expired token');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                identityLevel: true,
                skillTrack: true,
                avatarUrl: true,
                isActive: true,
                cohort: {
                    select: { id: true, name: true },
                },
                applicant: {
                    select: {
                        triadTechnical: true,
                        triadSoft: true,
                        triadCommercial: true,
                    },
                },
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is paused');
        }

        return user;
    }

    /**
     * Generate 6-digit OTP
     */
    private generateOtp(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Generate JWT-like token (simplified)
     */
    private generateToken(userId: string, email: string): string {
        const payload: TokenPayload = {
            userId,
            email,
            exp: Date.now() + this.tokenExpiryDays * 24 * 60 * 60 * 1000,
        };

        const data = Buffer.from(JSON.stringify(payload)).toString('base64');
        const signature = crypto
            .createHmac('sha256', this.jwtSecret)
            .update(data)
            .digest('base64url');

        return `${data}.${signature}`;
    }

    /**
     * Verify and decode token
     */
    verifyToken(token: string): TokenPayload | null {
        try {
            const [data, signature] = token.split('.');

            const expectedSignature = crypto
                .createHmac('sha256', this.jwtSecret)
                .update(data)
                .digest('base64url');

            if (signature !== expectedSignature) {
                return null;
            }

            const payload: TokenPayload = JSON.parse(Buffer.from(data, 'base64').toString());

            if (payload.exp < Date.now()) {
                return null;
            }

            return payload;
        } catch {
            return null;
        }
    }
}
