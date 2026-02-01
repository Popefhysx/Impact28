import { IsString, IsOptional, IsArray, MaxLength, MinLength } from 'class-validator';

export class SubmitTestimonialDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    role: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    company?: string;

    @IsString()
    @MinLength(2)
    @MaxLength(50)
    location: string;

    @IsString()
    @MinLength(20)
    @MaxLength(500)
    quote: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsString()
    imageKey?: string;  // R2 object key (e.g., "testimonials/uuid.webp")
}

// DTO for admin editing testimonials
export class UpdateTestimonialDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    role?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    company?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    location?: string;

    @IsOptional()
    @IsString()
    @MinLength(20)
    @MaxLength(500)
    quote?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsString()
    imageKey?: string;  // New R2 object key (for replacing image)
}
