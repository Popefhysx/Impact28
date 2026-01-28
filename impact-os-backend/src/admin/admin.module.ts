import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaModule } from '../prisma';
import { AdmissionModule } from '../admission';

@Module({
    imports: [PrismaModule, AdmissionModule],
    controllers: [AdminController],
    providers: [AdminService],
    exports: [AdminService],
})
export class AdminModule { }
