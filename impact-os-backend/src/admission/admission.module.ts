import { Module } from '@nestjs/common';
import { AdmissionService } from './admission.service';
import { PrismaModule } from '../prisma';
import { EmailModule } from '../email';

@Module({
    imports: [PrismaModule, EmailModule],
    providers: [AdmissionService],
    exports: [AdmissionService],
})
export class AdmissionModule { }
