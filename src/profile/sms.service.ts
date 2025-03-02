import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Fast2SmsResponse {
  return: boolean;
  message: string;
  data?: any;
}

@Injectable()
export class SmsService {
  private readonly apiKey: string;
  private readonly logger = new Logger(SmsService.name);
  private readonly apiUrl = 'https://www.fast2sms.com/dev/bulkV2';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('FAST2SMS_API_KEY') || '';
    if (!this.apiKey) {
      this.logger.warn('FAST2SMS_API_KEY is not set in environment variables');
    }
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private validateAndCleanPhone(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle numbers with Indian country code
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.slice(2);
    }
    // Handle numbers with leading zero
    else if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
    }
    // Handle international format (+91) with 10 digits
    else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      // Valid Indian mobile number
      return cleaned;
    }

    // Final validation
    if (cleaned.length !== 10 || !/^[6-9]/.test(cleaned)) {
      throw new HttpException(
        'Invalid Indian mobile number. Valid formats: 9876543210, +919876543210, 09876543210',
        HttpStatus.BAD_REQUEST
      );
    }

    return cleaned;
  }

  async sendOtp(phone: string, otp: string): Promise<Fast2SmsResponse> {
    if (!phone || !otp) {
      throw new HttpException('Phone number and OTP are required', HttpStatus.BAD_REQUEST);
    }

    let validNumber: string;
    try {
      validNumber = this.validateAndCleanPhone(phone);
    } catch (error) {
      this.logger.warn(`Invalid phone number: ${phone}`);
      throw error;
    }

    if (!this.apiKey) {
      this.logger.error('Cannot send SMS: API key is not configured');
      throw new HttpException('SMS service is not properly configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: validNumber,
        }),
      });

      const data: Fast2SmsResponse = await response.json();

      if (!response.ok || !data.return) {
        const errorMessage = data.message || 'Failed to send OTP';
        this.logger.warn(`Fast2SMS error: ${errorMessage}`);
        throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`OTP sent successfully to ${validNumber}`);
      return data;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      this.logger.error(`SMS sending failed: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to send OTP. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  async sendOtpWithRetry(
    phone: string,
    otp: string,
    maxRetries = 3
  ): Promise<Fast2SmsResponse> {
    let lastError: Error = new Error('Failed to send OTP after all retries');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.sendOtp(phone, otp);
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