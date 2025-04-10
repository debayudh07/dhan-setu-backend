import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TwilioVerifyResponse {
  success: boolean;
  message: string;
  sid?: string;
  data?: any;
}

@Injectable()
export class SmsService {
  private readonly twilioClient: any;
  private readonly logger = new Logger(SmsService.name);
  private readonly verifyServiceSid: string;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.verifyServiceSid = this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID')!;

    if (!accountSid || !authToken || !this.verifyServiceSid) {
      this.logger.warn('Twilio credentials are not properly set in environment variables');
    }

    // Use require syntax as in the example
    this.twilioClient = require('twilio')(accountSid, authToken);
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private validateAndFormatPhone(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle numbers with Indian country code
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+91${cleaned.slice(2)}`;
    }
    // Handle numbers with leading zero
    else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return `+91${cleaned.slice(1)}`;
    }
    // Handle plain 10 digit numbers (add country code)
    else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return `+91${cleaned}`;
    }

    // Final validation
    if (cleaned.length !== 10 || !/^[6-9]/.test(cleaned.slice(-10))) {
      throw new HttpException(
        'Invalid mobile number. Valid formats: 9876543210, +919876543210, 09876543210',
        HttpStatus.BAD_REQUEST
      );
    }

    return `+91${cleaned.slice(-10)}`;
  }

  async sendOtp(phone: string): Promise<TwilioVerifyResponse> {
    if (!phone) {
      throw new HttpException('Phone number is required', HttpStatus.BAD_REQUEST);
    }

    let formattedNumber: string;
    try {
      formattedNumber = this.validateAndFormatPhone(phone);
    } catch (error) {
      this.logger.warn(`Invalid phone number: ${phone}`);
      throw error;
    }

    if (!this.twilioClient || !this.verifyServiceSid) {
      this.logger.error('Cannot send verification: Twilio is not properly configured');
      throw new HttpException('SMS service is not properly configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const verification = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verifications
        .create({ to: formattedNumber, channel: 'sms' });

      this.logger.log(`Verification initiated for ${formattedNumber} with SID: ${verification.sid}`);
      
      return {
        success: true,
        message: 'Verification code sent successfully',
        sid: verification.sid
      };
    } catch (error) {
      this.logger.error(`Verification failed: ${error.message}`, error.stack);
      
      // Handle specific Twilio errors
      if (error.code === 60200) { // Invalid parameter
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else if (error.code === 60203) { // Max send attempts reached
        throw new HttpException('Too many verification attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
      } else if (error.status === 401) {
        throw new HttpException('Authentication error with Twilio', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      throw new HttpException(
        'Failed to send verification code. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async verifyOtp(phone: string, code: string): Promise<TwilioVerifyResponse> {
    if (!phone || !code) {
      throw new HttpException('Phone number and verification code are required', HttpStatus.BAD_REQUEST);
    }

    let formattedNumber: string;
    try {
      formattedNumber = this.validateAndFormatPhone(phone);
    } catch (error) {
      this.logger.warn(`Invalid phone number: ${phone}`);
      throw error;
    }

    try {
      const verificationCheck = await this.twilioClient.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks
        .create({ to: formattedNumber, code });

      if (verificationCheck.status === 'approved') {
        this.logger.log(`Verification successful for ${formattedNumber}`);
        return {
          success: true,
          message: 'Verification successful',
          data: { status: verificationCheck.status }
        };
      } else {
        this.logger.warn(`Verification failed for ${formattedNumber}: ${verificationCheck.status}`);
        throw new HttpException('Invalid verification code', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      this.logger.error(`Verification check failed: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) throw error;
      
      if (error.code === 60200) { // Invalid parameter
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      } else if (error.code === 60202) { // Max check attempts reached
        throw new HttpException('Too many failed verification attempts', HttpStatus.TOO_MANY_REQUESTS);
      } 
      
      throw new HttpException(
        'Failed to verify code. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async sendOtpWithRetry(
    phone: string,
    maxRetries = 3
  ): Promise<TwilioVerifyResponse> {
    let lastError: Error = new Error('Failed to send verification code after all retries');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendOtp(phone);
      } catch (error) {
        lastError = error;

        if (error instanceof HttpException && error.getStatus() < 500) {
          throw error;
        }

        this.logger.warn(`Attempt ${attempt} failed. ${attempt < maxRetries ? 'Retrying...' : ''}`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  }
}