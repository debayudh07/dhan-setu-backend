import { IsString, Matches, IsNotEmpty } from 'class-validator';

export class RequestPhoneVerificationDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+\d{1,4}\d{10}$/, {
    message: 'Phone number must be in format: +CountryCodeNumber',
  })
  phoneNumber: string;
}

export class VerifyPhoneDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'OTP must be a 6-digit number',
  })
  otp: string;
}