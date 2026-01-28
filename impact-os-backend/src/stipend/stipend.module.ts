import { Module } from '@nestjs/common';
import { StipendService } from './stipend.service';
import { StipendController } from './stipend.controller';
import { PrismaModule } from '../prisma';
import { CurrencyModule } from '../currency';

@Module({
    imports: [PrismaModule, CurrencyModule],
    controllers: [StipendController],
    providers: [StipendService],
    exports: [StipendService],
})
export class StipendModule { }

