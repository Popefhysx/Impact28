import { Module } from '@nestjs/common';
import { NotificationRoutingService } from './notification-routing.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma';
import { StaffModule } from '../staff/staff.module';

@Module({
    imports: [PrismaModule, StaffModule],
    controllers: [NotificationsController],
    providers: [NotificationRoutingService, NotificationsService],
    exports: [NotificationRoutingService, NotificationsService],
})
export class NotificationsModule { }
