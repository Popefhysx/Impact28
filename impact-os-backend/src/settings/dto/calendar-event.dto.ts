import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { CalendarEventType } from '@prisma/client';

export class CreateCalendarEventDto {
    @IsString()
    title: string;

    @IsDateString()
    date: string;

    @IsString()
    @IsOptional()
    time?: string;

    @IsEnum(CalendarEventType)
    type: CalendarEventType;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    cohortId?: string;
}

export class UpdateCalendarEventDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    time?: string;

    @IsEnum(CalendarEventType)
    @IsOptional()
    type?: CalendarEventType;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    cohortId?: string;
}
