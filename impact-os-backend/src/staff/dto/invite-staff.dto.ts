import { IsEmail, IsEnum, IsOptional, IsString, IsArray } from 'class-validator';
import { StaffCategory } from '@prisma/client';

export class InviteStaffDto {
    @IsEmail()
    email: string;

    @IsEnum(StaffCategory)
    category: StaffCategory;

    @IsOptional()
    @IsString()
    templateId?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    capabilities?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    cohortIds?: string[];
}
