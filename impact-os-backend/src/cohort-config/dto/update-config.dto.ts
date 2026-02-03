import {
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class UpdateCohortConfigDto {
  @IsOptional()
  @IsBoolean()
  applicationsOpen?: boolean;

  @IsOptional()
  @IsDateString()
  openDate?: string;

  @IsOptional()
  @IsDateString()
  closeDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disabledTracks?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  founderMessageTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  founderMessageBody?: string;

  @IsOptional()
  @IsString()
  founderName?: string;

  @IsOptional()
  @IsString()
  founderImageUrl?: string;

  @IsOptional()
  @IsString()
  founderSignatureUrl?: string;

  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;
}
