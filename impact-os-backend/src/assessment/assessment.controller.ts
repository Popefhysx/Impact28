import { Controller, Get, Post, Param } from '@nestjs/common';
import { AssessmentService } from './assessment.service';

/**
 * Assessment Controller
 *
 * Endpoints for running and retrieving applicant assessments
 */
@Controller('assessment')
export class AssessmentController {
  constructor(private assessmentService: AssessmentService) {}

  /**
   * Run assessment for an applicant
   * POST /assessment/:applicantId/assess
   */
  @Post(':applicantId/assess')
  async assessApplicant(@Param('applicantId') applicantId: string) {
    return this.assessmentService.assessApplicant(applicantId);
  }

  /**
   * Get assessment summary for offer email
   * GET /assessment/:applicantId/summary
   */
  @Get(':applicantId/summary')
  async getAssessmentSummary(@Param('applicantId') applicantId: string) {
    return this.assessmentService.getAssessmentSummary(applicantId);
  }
}
