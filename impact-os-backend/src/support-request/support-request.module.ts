import { Module } from '@nestjs/common';
import { SupportRequestService } from './support-request.service';
import { SupportRequestController } from './support-request.controller';
import { PrismaModule } from '../prisma';

/**
 * Support Request Module
 *
 * Participant-facing support request flow.
 * Support is request-based and behavior-gated per documentation.
 */
@Module({
  imports: [PrismaModule],
  providers: [SupportRequestService],
  controllers: [SupportRequestController],
  exports: [SupportRequestService],
})
export class SupportRequestModule {}
