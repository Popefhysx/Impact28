import { IsString, IsDateString, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';

export class CreateCohortDto {
    @IsString()
    name: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    capacity?: number;
}

export class UpdateCohortDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    capacity?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
