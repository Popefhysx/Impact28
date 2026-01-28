import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { SubmitPartnerInquiryDto } from './dto';

@Controller('partners')
export class PartnersController {
    constructor(private readonly partnersService: PartnersService) { }

    // POST /partners/inquiry - Public: Submit sponsor or partner inquiry
    @Post('inquiry')
    submitInquiry(@Body() dto: SubmitPartnerInquiryDto) {
        return this.partnersService.submitInquiry(dto);
    }

    // GET /partners/admin/all - Admin: Get all inquiries
    @Get('admin/all')
    getAllInquiries() {
        // TODO: Add auth guard for admin
        return this.partnersService.getAllInquiries();
    }

    // PUT /partners/admin/sponsor/:id/status - Admin: Update sponsor status
    @Put('admin/sponsor/:id/status')
    updateSponsorStatus(
        @Param('id') id: string,
        @Query('status') status: string,
        @Body('notes') notes?: string,
    ) {
        return this.partnersService.updateSponsorStatus(id, status, notes);
    }

    // PUT /partners/admin/partner/:id/status - Admin: Update partner status
    @Put('admin/partner/:id/status')
    updatePartnerStatus(
        @Param('id') id: string,
        @Query('status') status: string,
        @Body('notes') notes?: string,
    ) {
        return this.partnersService.updatePartnerStatus(id, status, notes);
    }
}
