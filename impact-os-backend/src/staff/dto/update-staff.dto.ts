import {
  IsOptional,
  IsEnum,
  IsArray,
  IsString,
  IsBoolean,
} from 'class-validator';
import { StaffCategory } from '@prisma/client';

export class UpdateStaffDto {
  @IsOptional()
  @IsEnum(StaffCategory)
  category?: StaffCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cohortIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  queueIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];

  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationPrefs?: string[];
}
