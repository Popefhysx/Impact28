import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { PrismaModule } from '../prisma';
import { NotificationsModule } from '../notifications';

@Module({
  imports: [PrismaModule, forwardRef(() => NotificationsModule)],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule { }

