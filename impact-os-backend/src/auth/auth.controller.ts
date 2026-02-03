import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  /**
   * Check if email exists (for login vs registration flow)
   */
  @Post('check-email')
  async checkEmail(@Body('email') email: string) {
    return this.authService.checkEmail(email);
  }

  /**
   * Request OTP code (sends email)
   */
  @Post('request-otp')
  async requestOtp(@Body('email') email: string) {
    return this.authService.requestOtp(email);
  }

  /**
   * Verify OTP and get auth token
   */
  @Post('verify-otp')
  async verifyOtp(@Body('email') email: string, @Body('code') code: string) {
    return this.authService.verifyOtp(email, code);
  }

  /**
   * Login with username + PIN (primary auth for participants)
   */
  @Post('login')
  async login(@Body('username') username: string, @Body('pin') pin: string) {
    return this.authService.loginByUsernamePin(username, pin);
  }

  /**
   * Get current authenticated user
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getCurrentUser(@Req() req: any) {
    // req.user is populated by JwtStrategy
    return this.authService.getCurrentUser(req.user.id);
  }

  /**
   * Logout (client-side token removal, no server action needed)
   */
  @Post('logout')
  async logout() {
    // With JWT, logout is handled client-side by removing the token
    return { success: true, message: 'Logged out successfully' };
  }
}
