import { IsString, Length, Matches, MinLength } from 'class-validator';

export class AcceptOfferDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-z][a-z0-9._]*$/, {
    message:
      'Username must start with a letter and contain only lowercase letters, numbers, dots, and underscores',
  })
  username: string;

  @IsString()
  @Length(4, 4, { message: 'PIN must be exactly 4 digits' })
  @Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits' })
  pin: string;
}
