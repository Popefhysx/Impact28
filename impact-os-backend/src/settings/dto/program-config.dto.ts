import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  IsEmail,
  Min,
  Max,
} from 'class-validator';

export class UpdateProgramConfigDto {
  @IsString()
  @IsOptional()
  programName?: string;

  @IsString()
  @IsOptional()
  organizationName?: string;

  @IsEmail()
  @IsOptional()
  supportEmail?: string;

  @IsString()
  @IsOptional()
  dashboardUrl?: string;

  @IsInt()
  @Min(1)
  @Max(60)
  @IsOptional()
  otpExpiryMinutes?: number;

  @IsBoolean()
  @IsOptional()
  allowSelfSignup?: boolean;

  @IsBoolean()
  @IsOptional()
  requireOrientation?: boolean;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxApplicationsPerCohort?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  supportRequestTTLDays?: number;

  @IsBoolean()
  @IsOptional()
  autoExpireSupportRequests?: boolean;
}
