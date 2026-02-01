import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma';
import { IntakeModule } from './intake';
import { EmailModule } from './email';
import { TestimonialsModule } from './testimonials';
import { PartnersModule } from './partners';
import { CohortConfigModule } from './cohort-config';
import { ScoringModule } from './scoring';
import { AdmissionModule } from './admission';
import { CurrencyModule } from './currency';
import { StipendModule } from './stipend';
import { IncomeModule } from './income';
import { MissionModule } from './mission';
import { AdminModule } from './admin';
import { AssessmentModule } from './assessment';
import { AuthModule } from './auth';
import { StaffModule } from './staff';
import { ProgressModule } from './progress';
import { PsnModule } from './psn';
import { SupportRequestModule } from './support-request';
import { ResourceModule } from './resource/resource.module';
import { ScheduledTasksModule } from './scheduled-tasks';
import { WallModule } from './wall';
import { CommunicationsModule } from './communications';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    IntakeModule,
    EmailModule,
    TestimonialsModule,
    PartnersModule,
    CohortConfigModule,
    ScoringModule,
    AdmissionModule,
    CurrencyModule,
    StipendModule,
    IncomeModule,
    MissionModule,
    AdminModule,
    AssessmentModule,
    StaffModule,
    ProgressModule,
    PsnModule,
    SupportRequestModule,
    ResourceModule,
    ScheduledTasksModule,
    WallModule,
    CommunicationsModule,
  ],
})
export class AppModule { }

