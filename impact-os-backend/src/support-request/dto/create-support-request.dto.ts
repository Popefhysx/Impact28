import { IsEnum, IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';
import { SupportType } from '@prisma/client';

/**
 * DTO for creating a support request
 * 
 * Participants submit structured requests with:
 * - Support type (Data/Transport/Tools/Counselling - Cash hidden by default)
 * - Mission link (optional but recommended)
 * - Justification (max 200 chars)
 * - Evidence (optional)
 */
export class CreateSupportRequestDto {
    @IsEnum(SupportType)
    @IsNotEmpty()
    type: SupportType;

    @IsString()
    @IsOptional()
    missionId?: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(200, { message: 'Justification must be 200 characters or less' })
    justification: string;

    @IsString()
    @IsOptional()
    evidence?: string;
}
