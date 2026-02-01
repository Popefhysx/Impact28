import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { IsIn, IsString, IsNotEmpty } from 'class-validator';
import { R2Service } from './r2.service';

class SignUploadDto {
    @IsIn(['testimonial', 'partner', 'avatar', 'intake'])
    type!: 'testimonial' | 'partner' | 'avatar' | 'intake';

    @IsString()
    @IsNotEmpty()
    contentType!: string; // "image/webp"
}

@Controller('uploads')
export class UploadsController {
    constructor(private readonly r2: R2Service) { }

    /**
     * Generate a pre-signed URL for direct upload to R2
     * 
     * POST /api/uploads/sign
     * Body: { type: "testimonial", contentType: "image/webp" }
     * 
     * Returns: { uploadUrl, key, publicUrl }
     */
    @Post('sign')
    @HttpCode(HttpStatus.OK)
    async sign(@Body() dto: SignUploadDto) {
        return this.r2.signUpload(dto);
    }
}
