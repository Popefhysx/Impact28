import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma';
import { EmailModule } from '../email';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret:
          configService.get('JWT_SECRET') ||
          'impact-os-dev-secret-change-in-prod',
        signOptions: { expiresIn: '30d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, JwtStrategy],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule { }

