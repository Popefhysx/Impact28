import {
  Controller,
} from '@nestjs/common';
import { AdmissionService } from './admission.service';

/**
 * Admission Controller
 *
 * All admission decisions (ADMIT, REJECT, WAITLIST) are admin-driven
 * and handled through the admin service's updateApplicantStatus endpoint.
 * This controller is retained for module registration only.
 */
@Controller('admission')
export class AdmissionController {
  constructor(
    private readonly admissionService: AdmissionService,
  ) { }
}
