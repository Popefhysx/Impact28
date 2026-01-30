import { IsString, IsOptional, IsEnum, IsArray, IsUrl } from 'class-validator';
import { ResourceType, SkillTrack } from '@prisma/client';

export class CreateResourceDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsUrl()
    url: string;

    @IsEnum(ResourceType)
    type: ResourceType;

    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(SkillTrack, { each: true })
    skillTracks?: SkillTrack[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}

export class FetchMetadataDto {
    @IsUrl()
    url: string;
}

export class UpdateResourceDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(ResourceType)
    type?: ResourceType;

    @IsOptional()
    @IsString()
    thumbnail?: string;

    @IsOptional()
    @IsArray()
    @IsEnum(SkillTrack, { each: true })
    skillTracks?: SkillTrack[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];
}

export class ResourceQueryDto {
    @IsOptional()
    @IsEnum(ResourceType)
    type?: ResourceType;

    @IsOptional()
    @IsEnum(SkillTrack)
    skillTrack?: SkillTrack;

    @IsOptional()
    @IsString()
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';

    @IsOptional()
    @IsString()
    search?: string;
}
