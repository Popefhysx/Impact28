import { IsString, IsEmail, IsInt, IsEnum, IsOptional, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Gender, LeadSource } from '@prisma/client';

export class StartApplicationDto {
    @IsString()
    @MinLength(2)
    @MaxLength(25)
    firstName: string;

    @IsString()
    @MinLength(2)
    @MaxLength(25)
    lastName: string;

    @IsString()
    whatsapp: string;

    @IsEmail()
    email: string;

    @IsInt()
    @Min(16)
    @Max(45)
    age: number;

    @IsString()
    country: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsEnum(Gender)
    gender: Gender;

    @IsOptional()
    @IsEnum(LeadSource)
    source?: LeadSource;

    // Attribution
    @IsOptional()
    @IsString()
    utmSource?: string;

    @IsOptional()
    @IsString()
    utmMedium?: string;

    @IsOptional()
    @IsString()
    utmCampaign?: string;

    @IsOptional()
    @IsString()
    referralCode?: string;

    @IsOptional()
    @IsString()
    deviceDetected?: string;
}
