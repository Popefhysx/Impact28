import { Module } from '@nestjs/common';
import { IncomeService } from './income.service';
import { IncomeController } from './income.controller';
import { PrismaModule } from '../prisma';
import { CurrencyModule } from '../currency';

@Module({
    imports: [PrismaModule, CurrencyModule],
    controllers: [IncomeController],
    providers: [IncomeService],
    exports: [IncomeService],
})
export class IncomeModule { }
