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
}
