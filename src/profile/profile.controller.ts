import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Req, 
  HttpCode,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/profile.dto';
import { RequestPhoneVerificationDto, VerifyPhoneDto } from './dto/phone-verification.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.profileService.getProfile(req.user.id);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, updateProfileDto);
  }

  @Post('profile-picture')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.profileService.uploadProfilePicture(req.user.id, file);
  }

  @Post('portfolio')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPortfolio(
    @Req() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.profileService.uploadPortfolio(req.user.id, file);
  }

  @Post('document/:side')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentImage(
    @Req() req,
    @Param('side') side: 'front' | 'back',
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.profileService.uploadDocumentImage(req.user.id, side, file);
  }

  @Post('request-phone-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async requestPhoneVerification(
    @Req() req,
    @Body() requestPhoneVerificationDto: RequestPhoneVerificationDto,
  ) {
    return this.profileService.requestPhoneVerification(
      req.user.id, 
      requestPhoneVerificationDto.phoneNumber
    );
  }
  
  @Post('verify-phone')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async verifyPhone(
    @Req() req, 
    @Body() verifyPhoneDto: VerifyPhoneDto
  ) {
    return this.profileService.verifyPhoneNumber(req.user.id, verifyPhoneDto.otp);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteProfile(@Req() req) {
    return this.profileService.deleteProfile(req.user.id);
  }
}
