import { Module } from '@nestjs/common';
import { NotificationRoutingService } from './notification-routing.service';
import { PrismaModule } from '../prisma';

@Module({
    imports: [PrismaModule],
    providers: [NotificationRoutingService],
    exports: [NotificationRoutingService],
})
export class NotificationsModule { }
