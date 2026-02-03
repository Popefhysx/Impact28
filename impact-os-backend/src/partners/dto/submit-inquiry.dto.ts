import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';

// Combined sponsor/partner inquiry types
export enum PartnerInterestType {
  // Sponsor types
  SPONSOR_ONE_MONTH = 'SPONSOR_ONE_MONTH',
  SPONSOR_FULL_PROGRAM = 'SPONSOR_FULL_PROGRAM',
  SPONSOR_CUSTOM = 'SPONSOR_CUSTOM',
  SPONSOR_CORPORATE = 'SPONSOR_CORPORATE',

  // Partner types
  TRAINING_PARTNER = 'TRAINING_PARTNER',
  EMPLOYMENT_PARTNER = 'EMPLOYMENT_PARTNER',
  VENUE_PARTNER = 'VENUE_PARTNER',
  CONTENT_PARTNER = 'CONTENT_PARTNER',
  MEDIA_PARTNER = 'MEDIA_PARTNER',
  CHURCH_PARTNER = 'CHURCH_PARTNER',
  SCHOOL_PARTNER = 'SCHOOL_PARTNER',
  OTHER = 'OTHER',
}

export class SubmitPartnerInquiryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  organizationName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  organizationType?: string; // Individual, Corporate, NGO, Church, School

  @IsEnum(PartnerInterestType)
  interestType: PartnerInterestType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  amountInterest?: string; // For sponsors: "50000", "150000", "custom"

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
