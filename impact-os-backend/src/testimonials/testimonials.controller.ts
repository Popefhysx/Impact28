import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { SubmitTestimonialDto, UpdateTestimonialDto } from './dto';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  // GET /testimonials - Public: Get approved testimonials
  @Get()
  getApproved() {
    return this.testimonialsService.getApproved();
  }

  // POST /testimonials - Public: Submit new testimonial
  @Post()
  submit(@Body() dto: SubmitTestimonialDto) {
    return this.testimonialsService.submit(dto);
  }

  // GET /testimonials/admin/all - Admin: Get all (for moderation)
  @Get('admin/all')
  getAll() {
    // TODO: Add auth guard for admin
    return this.testimonialsService.getAll();
  }

  // PUT /testimonials/admin/:id - Admin: Edit testimonial
  @Put('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.testimonialsService.update(id, dto);
  }

  // PUT /testimonials/admin/:id/approve - Admin: Approve
  @Put('admin/:id/approve')
  approve(@Param('id') id: string) {
    // TODO: Get approvedBy from auth context
    return this.testimonialsService.approve(id, 'admin');
  }

  // PUT /testimonials/admin/:id/reject - Admin: Reject
  @Put('admin/:id/reject')
  reject(@Param('id') id: string) {
    return this.testimonialsService.reject(id);
  }

  // PUT /testimonials/admin/:id/display - Admin: Update display order/featured
  @Put('admin/:id/display')
  updateDisplay(
    @Param('id') id: string,
    @Body() body: { displayOrder?: number; isFeatured?: boolean },
  ) {
    return this.testimonialsService.updateDisplay(
      id,
      body.displayOrder,
      body.isFeatured,
    );
  }
}
