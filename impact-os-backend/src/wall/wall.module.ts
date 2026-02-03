import { Module } from '@nestjs/common';
import { WallService } from './wall.service';
import { WallController } from './wall.controller';
import { PrismaModule } from '../prisma';
import { MissionModule } from '../mission';
import { AuthModule } from '../auth';

@Module({
  imports: [PrismaModule, MissionModule, AuthModule],
  controllers: [WallController],
  providers: [WallService],
  exports: [WallService],
})
export class WallModule {}
