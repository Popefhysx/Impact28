import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  Min,
  Matches,
} from 'class-validator';

export class CreatePhaseDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^[A-Z0-9_]+$/, {
    message: 'Slug must be uppercase with underscores',
  })
  slug: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationDays?: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdatePhaseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationDays?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ReorderPhasesDto {
  @IsString({ each: true })
  orderedIds: string[];
}
