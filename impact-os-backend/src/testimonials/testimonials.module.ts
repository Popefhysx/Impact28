import { Module } from '@nestjs/common';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { UploadsModule } from '../uploads';
import { EmailModule } from '../email';

@Module({
  imports: [UploadsModule, EmailModule],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
  exports: [TestimonialsService],
})
export class TestimonialsModule { }
