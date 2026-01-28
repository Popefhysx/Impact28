import { Controller, Post, Put, Get, Body, Param, Query } from '@nestjs/common';
import { IntakeService } from './intake.service';
import { StartApplicationDto, Section2Dto, Section3Dto, Section4Dto, Section5Dto, Section6Dto } from './dto';

@Controller('intake')
export class IntakeController {
    constructor(private readonly intakeService: IntakeService) { }

    // POST /intake/start - Start a new application (Section 1)
    @Post('start')
    startApplication(@Body() dto: StartApplicationDto) {
        return this.intakeService.startApplication(dto);
    }

    // PUT /intake/:id/section/2 - Update Section 2
    @Put(':id/section/2')
    updateSection2(@Param('id') id: string, @Body() dto: Section2Dto) {
        return this.intakeService.updateSection2(id, dto);
    }

    // PUT /intake/:id/section/3 - Update Section 3
    @Put(':id/section/3')
    updateSection3(@Param('id') id: string, @Body() dto: Section3Dto) {
        return this.intakeService.updateSection3(id, dto);
    }

    // PUT /intake/:id/section/4 - Update Section 4
    @Put(':id/section/4')
    updateSection4(@Param('id') id: string, @Body() dto: Section4Dto) {
        return this.intakeService.updateSection4(id, dto);
    }

    // PUT /intake/:id/section/5 - Update Section 5
    @Put(':id/section/5')
    updateSection5(@Param('id') id: string, @Body() dto: Section5Dto) {
        return this.intakeService.updateSection5(id, dto);
    }

    // POST /intake/:id/submit - Submit application (Section 6)
    @Post(':id/submit')
    submitApplication(@Param('id') id: string, @Body() dto: Section6Dto) {
        return this.intakeService.submitApplication(id, dto);
    }

    // GET /intake/:id/status - Get application status
    @Get(':id/status')
    getStatus(@Param('id') id: string) {
        return this.intakeService.getStatus(id);
    }

    // GET /intake/resume?token=xxx - Resume with token
    @Get('resume')
    resumeWithToken(@Query('token') token: string) {
        return this.intakeService.resumeWithToken(token);
    }

    // GET /intake/find?email=xxx - Find application by email
    @Get('find')
    findByEmail(@Query('email') email: string) {
        return this.intakeService.findByEmail(email);
    }
}
