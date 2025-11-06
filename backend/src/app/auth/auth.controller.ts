import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string }) {
    const { email, password, name } = body;
    
    if (!email || !password || !name) {
      throw new HttpException('Email, password, and name are required', HttpStatus.BAD_REQUEST);
    }

    return this.authService.register(email, password, name);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    
    if (!email || !password) {
      throw new HttpException('Email and password are required', HttpStatus.BAD_REQUEST);
    }

    return this.authService.login(email, password);
  }
}