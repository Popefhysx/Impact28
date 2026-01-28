import { IsEnum, IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { CurrentStatus, EducationLevel, InternetAccess, WeeklyHours, DeviceType, SkillTrack } from '@prisma/client';

// Section 2: Current Situation
export class Section2Dto {
    @IsEnum(CurrentStatus)
    currentStatus: CurrentStatus;

    @IsEnum(EducationLevel)
    educationLevel: EducationLevel;

    @IsString()
    @MaxLength(150)
    biggestChallenge: string;
}

// Section 3: Resource Check
export class Section3Dto {
    @IsEnum(InternetAccess)
    hasInternet: InternetAccess;

    @IsEnum(WeeklyHours)
    weeklyHours: WeeklyHours;

    @IsEnum(DeviceType)
    primaryDevice: DeviceType;
}

// Section 4: Skill Interest
export class Section4Dto {
    @IsEnum(SkillTrack)
    skillTrack: SkillTrack;

    @IsBoolean()
    triedOnlineEarning: boolean;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    onlineEarningOutcome?: string;

    @IsBoolean()
    triedLearningSkill: boolean;
}

// Section 5: Diagnostic Probes
export class Section5Dto {
    @IsString()
    @MaxLength(300)
    technicalProbe: string;

    @IsString()
    @MaxLength(300)
    commercialProbe: string;

    @IsString()
    @MaxLength(300)
    exposureProbe: string;

    @IsString()
    @MaxLength(300)
    commitmentProbe: string;
}

// Section 6: Consent
export class Section6Dto {
    @IsBoolean()
    consentDailyAction: boolean;

    @IsBoolean()
    consentWeeklyCheckin: boolean;

    @IsBoolean()
    consentFailure: boolean;

    @IsBoolean()
    consentData: boolean;
}
