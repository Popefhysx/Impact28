import { Module, forwardRef } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { PrismaModule } from '../prisma';
import { EmailModule } from '../email';

@Module({
  imports: [PrismaModule, forwardRef(() => EmailModule)],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule { }

