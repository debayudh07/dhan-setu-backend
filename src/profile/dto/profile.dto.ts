import { IsString, IsOptional, IsEnum, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+\d{1,4}\d{10}$/, {
    message: 'Phone number must be in format: +CountryCodeNumber',
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(['passport', 'dl', 'national'], {
    message: 'Document type must be passport, dl, or national',
  })
  documentType?: string;
}